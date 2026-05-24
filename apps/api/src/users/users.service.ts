import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: {
    search?: string;
    roleId?: string;
    isActive?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const pageSize = Math.min(100, parseInt(query.pageSize || '20'));
    const where: Record<string, unknown> = { deletedAt: null };
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.isActive !== undefined) where['isActive'] = query.isActive === 'true';
    if (query.roleId) where['userRoles'] = { some: { roleId: query.roleId } };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, name: true, avatar: true,
          isVerified: true, isActive: true, mfaSecret: true, createdAt: true, updatedAt: true,
          userRoles: { select: { role: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      data: data.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive,
        hasMfaEnabled: Boolean(user.mfaSecret),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userRoles: user.userRoles,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, avatar: true,
        isVerified: true, isActive: true, mfaSecret: true, createdAt: true, updatedAt: true,
        userRoles: { select: { role: { select: { id: true, name: true, description: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      isActive: user.isActive,
      hasMfaEnabled: Boolean(user.mfaSecret),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      userRoles: user.userRoles,
    };
  }

  async createUser(data: { email: string; name: string; password: string; roleId?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: data.email, name: data.name, passwordHash, isVerified: true,
        ...(data.roleId ? { userRoles: { create: { roleId: data.roleId } } } : {}),
      },
    });
    return this.sanitize(user);
  }

  async updateUser(id: string, data: { name?: string; email?: string; isActive?: boolean; avatar?: string }) {
    await this.findById(id);
    if (data.email) {
      const conflict = await this.prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
      if (conflict) throw new ConflictException('Email already in use');
    }
    return this.prisma.user.update({
      where: { id }, data,
      select: { id: true, email: true, name: true, avatar: true, isVerified: true, isActive: true, updatedAt: true },
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!valid) throw new ForbiddenException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Password updated' };
  }

  async beginMfaSetup(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaSecret) throw new ConflictException('Two-factor authentication is already enabled');

    const issuer = this.configService.get<string>('APP_NAME') || 'AXON Admin';
    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      issuer,
      label: user.email,
      strategy: 'totp',
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 192 });

    return {
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      issuer,
      accountName: user.email,
    };
  }

  async enableMfa(userId: string, secret: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.mfaSecret) throw new ConflictException('Two-factor authentication is already enabled');
    if (!(await verify({ token, secret, strategy: 'totp' }))) {
      throw new ForbiddenException('Invalid authenticator code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: this.encryptMfaSecret(secret) },
    });

    return { message: 'Two-factor authentication enabled', hasMfaEnabled: true };
  }

  async disableMfa(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.mfaSecret) throw new ConflictException('Two-factor authentication is not enabled');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash || '');
    if (!valid) throw new ForbiddenException('Current password is incorrect');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: null },
    });

    return { message: 'Two-factor authentication disabled', hasMfaEnabled: false };
  }

  async assignRole(userId: string, roleId: string) {
    await this.findById(userId);
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId },
      update: {},
    });
    return { message: 'Role assigned' };
  }

  async removeRole(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return { message: 'Role removed' };
  }

  async softDelete(id: string) {
    await this.findById(id);
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { message: 'User deleted' };
  }

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, ip: true, userAgent: true, createdAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.session.delete({ where: { id: sessionId } });
    return { message: 'Session revoked' };
  }

  async getAuditLogs(userId: string) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async verifyMfaToken(encryptedSecret: string, token: string) {
    const secret = this.decryptMfaSecret(encryptedSecret);
    return verify({ token, secret, strategy: 'totp' });
  }

  private getMfaEncryptionKey() {
    const rawKey = this.configService.get<string>('APP_ENCRYPTION_KEY')
      || this.configService.get<string>('JWT_SECRET')
      || 'axon-admin-local-dev-key';
    return createHash('sha256').update(rawKey).digest();
  }

  private encryptMfaSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getMfaEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  private decryptMfaSecret(payload: string) {
    const [ivText, authTagText, cipherText] = payload.split('.');
    if (!ivText || !authTagText || !cipherText) {
      throw new ForbiddenException('Stored two-factor secret is invalid');
    }

    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.getMfaEncryptionKey(),
      Buffer.from(ivText, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagText, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(cipherText, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  sanitize(user: { passwordHash?: string | null; mfaSecret?: string | null; [key: string]: unknown }) {
    const { passwordHash, mfaSecret, ...rest } = user;
    return rest;
  }
}
