import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto, UpdateToolDto, ToolQueryDto } from './tools.dto';

@Injectable()
export class ToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ToolQueryDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.categoryId) where['categoryId'] = query.categoryId;
    if (query.pluginId) where['pluginId'] = query.pluginId;
    if (query.search) {
      where['OR'] = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tool.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { category: true, plugin: { select: { id: true, name: true, endpoint: true } } },
      }),
      this.prisma.tool.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const tool = await this.prisma.tool.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        plugin: true,
        versions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!tool) throw new NotFoundException('Tool not found');
    return tool;
  }

  async create(dto: CreateToolDto, userId?: string) {
    return this.prisma.tool.create({
      data: { ...dto, createdBy: userId },
    });
  }

  async update(id: string, dto: UpdateToolDto) {
    await this.findOne(id);
    return this.prisma.tool.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tool.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async execute(id: string, inputJson: object, userId?: string) {
    const tool = await this.findOne(id);
    const start = Date.now();
    let status = 'success';
    let outputJson: object | null = null;
    let errorMessage: string | undefined;

    try {
      if (!tool.plugin) throw new Error('Tool has no associated plugin');
      const res = await fetch(`${tool.plugin.endpoint}/tools/${tool.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputJson),
        signal: AbortSignal.timeout(tool.plugin.timeoutMs),
      });
      outputJson = await res.json() as object;
      if (!res.ok) status = 'error';
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    const durationMs = Date.now() - start;

    await this.prisma.toolExecutionLog.create({
      data: {
        toolId: id,
        userId,
        inputJson: JSON.stringify(inputJson),
        outputJson: outputJson ? JSON.stringify(outputJson) : null,
        status,
        durationMs,
        errorMessage,
      },
    });

    return { status, outputJson, durationMs, errorMessage };
  }

  async getCategories() {
    return this.prisma.toolCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
