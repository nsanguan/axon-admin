import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
          isVerified: true, isActive: true, createdAt: true, updatedAt: true,
          userRoles: { select: { role: { select: { id: true, name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, name: true, avatar: true,
        isVerified: true, isActive: true, createdAt: true, updatedAt: true,
        userRoles: { select: { role: { select: { id: true, name: true, description: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
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

  sanitize(user: { passwordHash?: string | null; mfaSecret?: string | null; [key: string]: unknown }) {
    const { passwordHash, mfaSecret, ...rest } = user;
    return rest;
  }
}
