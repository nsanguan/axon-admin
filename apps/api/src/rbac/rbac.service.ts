import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // Users (admin view)
  async findUsers(query: { search?: string; page?: string; pageSize?: string }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const where: Record<string, unknown> = {};
    if (query.search) {
      where['OR'] = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          mfaSecret: true,
          createdAt: true,
          userRoles: { include: { role: { select: { name: true } } } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async toggleUserActive(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  // Roles
  async findRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true, rolePermissions: true } },
        rolePermissions: { include: { permission: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(name: string, description?: string) {
    return this.prisma.role.create({ data: { name, description } });
  }

  async deleteRole(id: string) {
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  async assignRole(userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async removeRole(userId: string, roleId: string) {
    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    return { success: true };
  }

  // Permissions
  async findPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
  }
}
