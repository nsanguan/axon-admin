import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuditLogs(query: {
    userId?: string;
    action?: string;
    resourceType?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');
    const where: Record<string, unknown> = {};
    if (query.userId) where['userId'] = query.userId;
    if (query.action) where['action'] = { contains: query.action, mode: 'insensitive' };
    if (query.resourceType) where['resourceType'] = query.resourceType;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findSystemLogs(query: {
    level?: string;
    search?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '100');
    const where: Record<string, unknown> = {};
    if (query.level) where['level'] = query.level.toUpperCase();
    if (query.search) {
      where['message'] = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findExecutionLogs(query: {
    pluginId?: string;
    toolId?: string;
    status?: string;
    page?: string;
    pageSize?: string;
  }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '50');
    const where: Record<string, unknown> = {};
    if (query.pluginId) where['pluginId'] = query.pluginId;
    if (query.toolId) where['toolId'] = query.toolId;
    if (query.status) where['status'] = query.status;

    const [data, total] = await Promise.all([
      this.prisma.executionLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.executionLog.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
