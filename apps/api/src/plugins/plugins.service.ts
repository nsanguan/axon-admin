import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePluginDto, UpdatePluginDto, PluginQueryDto } from './plugins.dto';

@Injectable()
export class PluginsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PluginQueryDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where['status'] = query.status;
    if (query.groupId) where['groupId'] = query.groupId;
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { endpoint: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.plugin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { group: true, pluginTagMaps: { include: { tag: true } } },
      }),
      this.prisma.plugin.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const plugin = await this.prisma.plugin.findFirst({
      where: { id, deletedAt: null },
      include: {
        group: true,
        pluginTagMaps: { include: { tag: true } },
        envVars: { select: { id: true, key: true, isSecret: true } },
      },
    });
    if (!plugin) throw new NotFoundException('Plugin not found');
    return plugin;
  }

  async create(dto: CreatePluginDto, userId?: string) {
    return this.prisma.plugin.create({
      data: {
        ...dto,
        createdBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePluginDto) {
    await this.findOne(id);
    return this.prisma.plugin.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.plugin.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'inactive' },
    });
    return { success: true };
  }

  async checkHealth(id: string) {
    const plugin = await this.findOne(id);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${plugin.endpoint}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const status = res.ok ? 'healthy' : 'degraded';
      await this.prisma.plugin.update({
        where: { id },
        data: { healthStatus: status },
      });
      return { status, statusCode: res.status };
    } catch {
      await this.prisma.plugin.update({
        where: { id },
        data: { healthStatus: 'unreachable' },
      });
      return { status: 'unreachable' };
    }
  }
}
