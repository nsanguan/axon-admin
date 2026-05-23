---
name: security-hardening
description: Implement security controls for the AXON Admin platform including AES-256 encryption for tokens/secrets, Helmet.js headers, CSRF protection, rate limiting, input validation, and audit logging. Use when adding encryption to sensitive data, configuring security middleware, implementing rate limits, or reviewing security posture of API endpoints.
---

# Security Hardening — AXON Admin

## Security Stack

| Layer | Tool |
|---|---|
| HTTP Headers | Helmet.js |
| Rate Limiting | NestJS Throttler |
| Input Validation | class-validator + Zod |
| Encryption at Rest | AES-256-GCM (Node.js `crypto`) |
| Password Hashing | bcrypt (rounds=12) |
| CSRF Protection | Custom header check (`X-AXON-Request`) |
| SQL Injection | Prisma parameterized queries |
| XSS | Helmet CSP + DOMPurify on frontend |
| Auth Cookies | HttpOnly + SameSite=Strict + Secure |

## Step 1: Helmet + Global Security Middleware

```typescript
// apps/api/src/main.ts
import helmet from 'helmet';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet: sets 11 security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],  // needed for Next.js hydration
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.FRONTEND_URL!],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow Monaco editor iframes
  }));

  // CORS — only allow the frontend origin
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-AXON-Request'],
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

## Step 2: Rate Limiting

```typescript
// apps/api/src/app/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'short',  ttl: 60_000,    limit: 100  },  // 100 req/min per IP (general)
      { name: 'medium', ttl: 60_000,    limit: 20   },  // 20 req/min (auth endpoints)
      { name: 'long',   ttl: 3_600_000, limit: 1000 },  // 1000 req/hr per IP
    ]),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
```

```typescript
// Stricter rate limiting on auth endpoints:
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ medium: { limit: 5, ttl: 60_000 } })  // 5 login attempts per minute
  login(@Body() dto: LoginDto) { ... }

  @Post('register')
  @Throttle({ medium: { limit: 3, ttl: 60_000 } })  // 3 registrations per minute
  register(@Body() dto: RegisterDto) { ... }

  @Get('me')
  @SkipThrottle()  // profile reads don't need throttling
  getMe() { ... }
}
```

## Step 3: AES-256-GCM Encryption Service

```typescript
// apps/api/src/security/crypto.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:ciphertext (all hex)
    return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  decrypt(ciphertext: string): string {
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid ciphertext format');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateSecureToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  mask(value: string, visibleChars = 4): string {
    if (value.length <= visibleChars * 2) return '****';
    return value.slice(0, visibleChars) + '****' + value.slice(-visibleChars);
  }
}
```

Generate the encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: CSRF Protection

```typescript
// apps/api/src/security/csrf.middleware.ts
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];
const CSRF_HEADER = 'x-axon-request';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (SAFE_METHODS.includes(req.method)) return next();
    
    // For state-changing requests: require custom header
    // This prevents CSRF because browsers don't send custom headers in cross-site requests
    if (!req.headers[CSRF_HEADER]) {
      throw new ForbiddenException('Missing CSRF protection header');
    }
    next();
  }
}

// Register in AppModule:
// consumer.apply(CsrfMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
```

```typescript
// Frontend: add header to all mutating requests in api-client.ts
api.interceptors.request.use((config) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(config.method?.toUpperCase() ?? 'GET')) {
    config.headers['X-AXON-Request'] = '1';
  }
  return config;
});
```

## Step 5: Input Validation (NestJS Global Pipe)

```typescript
// apps/api/src/main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip unknown properties
  forbidNonWhitelisted: true,// throw on unknown properties
  transform: true,           // auto-cast types (string '1' → number 1)
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors) => {
    const messages = errors.flatMap(e => Object.values(e.constraints ?? {}));
    return new BadRequestException({ message: 'Validation failed', errors: messages });
  },
}));
```

## Step 6: Secure Cookie for Refresh Token

```typescript
// apps/api/src/auth/auth.controller.ts
import { Response } from 'express';

@Post('login')
async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const result = await this.authService.login(/* ... */);
  
  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    path: '/api/auth',                  // only sent to auth endpoints
  });

  return { accessToken: result.accessToken, user: result.user };
}

@Post('refresh')
async refresh(@Req() req: Request) {
  const token = req.cookies?.refresh_token;
  if (!token) throw new UnauthorizedException('No refresh token');
  return this.authService.refreshTokens(token, req.ip!, req.headers['user-agent']!);
}

@Post('logout')
async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const token = req.cookies?.refresh_token;
  if (token) await this.authService.revokeRefreshToken(token);
  res.clearCookie('refresh_token', { path: '/api/auth' });
  return { success: true };
}
```

## Step 7: Audit Logging Middleware

```typescript
// apps/api/src/security/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    // Fire-and-forget — don't await in hot paths
    this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        beforeJson: entry.before as any,
        afterJson: entry.after as any,
        ip: entry.ip,
        userAgent: entry.userAgent,
      },
    }).catch(console.error);
  }
}
```

Usage in any service:
```typescript
await this.auditService.log({
  userId: actorId,
  action: 'CREATE',
  resourceType: 'plugin',
  resourceId: plugin.id,
  after: { name: plugin.name, endpoint: plugin.endpoint },
  ip: requestIp,
});
```

## Step 8: Sensitive Data Redaction

```typescript
// apps/api/src/security/response-sanitizer.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const SENSITIVE_KEYS = ['passwordHash', 'mfaSecret', 'encryptedValue', 'apiKeyEncrypted', 'tokenHash'];

function redact(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(redact);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE_KEYS.includes(k) ? undefined : redact(v),
      ]).filter(([, v]) => v !== undefined),
    );
  }
  return obj;
}

@Injectable()
export class ResponseSanitizerInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(redact));
  }
}

// Register globally in main.ts:
// app.useGlobalInterceptors(new ResponseSanitizerInterceptor());
```

## Environment Variables Required

```env
ENCRYPTION_KEY=<64-char hex — generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_SECRET=<64-char random>
COOKIE_SECRET=<32-char random>
NODE_ENV=production
```

## Security Checklist

- [ ] `ENCRYPTION_KEY` is 32 random bytes (64 hex chars) — never reuse between environments
- [ ] `JWT_SECRET` is at least 32 random bytes
- [ ] All API tokens stored as SHA-256 hash; encrypted plaintext stored separately
- [ ] `passwordHash` and `mfaSecret` excluded from all API responses via `ResponseSanitizerInterceptor`
- [ ] Refresh tokens stored as SHA-256 hash; raw value only transmitted once (on creation)
- [ ] Rate limiting applied to `/api/auth/login` (5/min) and `/api/auth/register` (3/min)
- [ ] CSRF header checked on all POST/PUT/PATCH/DELETE routes
- [ ] Helmet configured with CSP, HSTS, X-Frame-Options
- [ ] Cookies: `httpOnly=true`, `secure=true` (production), `sameSite='strict'`, `path='/api/auth'`
- [ ] `npm audit` run in CI — no high/critical vulnerabilities allowed to merge
- [ ] Prisma: no raw SQL with string interpolation — always use parameterized `$queryRaw` with `Prisma.sql` template
- [ ] IP whitelists enforced on API token usage in `JwtAuthGuard`

## Rules

- Never log sensitive values (tokens, keys, passwords) — only log hashes or masked versions
- `CryptoService.decrypt()` is called only in service layer — never in controllers
- Token values in API responses always masked: `prefix****suffix` format
- `AuditService.log()` is always called async (fire-and-forget) to avoid blocking response
- All `$queryRaw` calls must use `Prisma.sql` tagged template or `Prisma.join` — never string interpolation
