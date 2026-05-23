---
name: auth-implementation
description: Implement JWT authentication, refresh token rotation, Google/GitHub OAuth, RBAC role guards, and 2FA for the AXON Admin platform. Use when building authentication endpoints, adding role-based access control to routes, implementing OAuth flows, or managing user sessions.
---

# Auth Implementation — AXON Admin

## Architecture Overview

```
Frontend (NextAuth.js)  ←→  Backend (NestJS Passport.js)
       ↓                            ↓
  Google/GitHub OAuth          JWT Access Token (15min)
  Session (JWT strategy)       Refresh Token (7d, rotated)
  useSession() hook            HttpOnly Cookie (refresh)
       ↓
  /api/auth/[...nextauth]  →  NestJS /api/auth/oauth/callback
```

## Step 1: NestJS Auth Module

### Install dependencies

```bash
pnpm --filter api add @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20 passport-github2 bcryptjs speakeasy qrcode class-validator
pnpm --filter api add -D @types/passport-jwt @types/passport-google-oauth20 @types/passport-github2 @types/bcryptjs @types/speakeasy @types/qrcode
```

### AuthModule

```typescript
// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '15m' },
      }),
    }),
    UsersModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GithubStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### AuthService

```typescript
// apps/api/src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');
    return user;
  }

  async login(user: any, ip: string, userAgent: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((ur: any) => ur.role.name),
    };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = await this.createRefreshToken(user.id, ip, userAgent);
    return { accessToken, refreshToken, user: this.sanitizeUser(user) };
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash },
    });
    // Assign default Viewer role
    const viewerRole = await this.prisma.role.findUnique({ where: { name: 'viewer' } });
    if (viewerRole) {
      await this.prisma.userRole.create({ data: { userId: user.id, roleId: viewerRole.id } });
    }
    return this.sanitizeUser(user);
  }

  async refreshTokens(token: string, ip: string, userAgent: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');
    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const newRefresh = await this.createRefreshToken(stored.userId, ip, userAgent);
    const payload = {
      sub: stored.user.id,
      email: stored.user.email,
      roles: stored.user.roles.map((ur: any) => ur.role.name),
    };
    return { accessToken: this.jwt.sign(payload), refreshToken: newRefresh };
  }

  private async createRefreshToken(userId: string, ip: string, userAgent: string) {
    const raw = uuidv4() + uuidv4();
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
    return raw;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }
}
```

## Step 2: JWT Strategy

```typescript
// apps/api/src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

## Step 3: Guards

```typescript
// apps/api/src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// apps/api/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user?.roles?.includes(role));
  }
}

// apps/api/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// apps/api/src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);
```

## Step 4: OAuth Strategies

```typescript
// apps/api/src/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: any) {
    return this.authService.findOrCreateOAuthUser({
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value,
      provider: 'google',
    });
  }
}
```

## Step 5: Next.js NextAuth.js Config

```typescript
// apps/web/lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { api } from './api-client';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const res = await api.post('/auth/login', credentials);
        return res.data.user ? { ...res.data.user, accessToken: res.data.accessToken } : null;
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) { token.accessToken = (user as any).accessToken; token.roles = (user as any).roles; }
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Exchange OAuth token for API JWT
        const res = await api.post('/auth/oauth/exchange', { provider: account.provider, token: account.access_token });
        token.accessToken = res.data.accessToken;
        token.roles = res.data.user.roles;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).roles = token.roles;
      return session;
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
};
```

## Step 6: Auth Middleware (Next.js)

```typescript
// apps/web/middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: ['/((?!login|register|forgot-password|api/auth|_next|favicon.ico).*)'],
};
```

## Role Hierarchy

| Role | Can do |
|---|---|
| `super_admin` | Everything — delete users, change roles, all settings |
| `admin` | All CRUD on plugins/tools/tokens, manage users (except super_admin) |
| `operator` | Enable/disable plugins, execute tools, run tests, view logs |
| `viewer` | Read-only access to all resources |

## 2FA (TOTP)

```typescript
// Enable 2FA — returns QR code URI
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

const secret = speakeasy.generateSecret({ name: `AXON Admin (${user.email})` });
const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
// Store secret.base32 encrypted in user.mfaSecret
// Verify: speakeasy.totp.verify({ secret: user.mfaSecret, encoding: 'base32', token: userToken })
```

## Environment Variables Required

```env
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=<32-char random string>
NEXTAUTH_URL=http://localhost:3000
API_URL=http://localhost:3001
```

## Rules

- Refresh tokens stored as SHA-256 hashes in DB — raw value only sent to client once
- Refresh token rotation: every use issues a new token and revokes the old one
- HttpOnly + SameSite=Strict cookies for refresh tokens in production
- Passwords hashed with bcrypt rounds=12
- Never return `passwordHash` or `mfaSecret` in any API response
- All state-changing auth endpoints require rate limiting (5 req/min via Throttler)
- OAuth flow always checks for existing user by email before creating new account
