import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AxonService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrchestratorRuns(query: { status?: string; page?: string; pageSize?: string }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;
    const [data, total] = await Promise.all([
      this.prisma.orchestratorRun.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          prompt: true,
          model: true,
          status: true,
          totalDurationMs: true,
          totalInputTokens: true,
          totalOutputTokens: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      this.prisma.orchestratorRun.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findAiAgentRuns(query: { status?: string; page?: string; pageSize?: string }) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;
    const [data, total] = await Promise.all([
      this.prisma.aiAgentRun.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          agentName: true,
          modelMode: true,
          modelName: true,
          prompt: true,
          status: true,
          totalDurationMs: true,
          inputTokens: true,
          outputTokens: true,
          errorMessage: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      this.prisma.aiAgentRun.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getOrchestratorRunDetail(id: string) {
    const run = await this.prisma.orchestratorRun.findUnique({
      where: { id },
      include: {
        stages: { orderBy: { stageNumber: 'asc' } },
        user: { select: { email: true } },
      },
    });
    return run;
  }

  async getStats() {
    const [orchTotal, agentTotal, orchByStatus, agentByStatus] = await Promise.all([
      this.prisma.orchestratorRun.count(),
      this.prisma.aiAgentRun.count(),
      this.prisma.orchestratorRun.groupBy({ by: ['status'], _count: { id: true } }),
      this.prisma.aiAgentRun.groupBy({ by: ['status'], _count: { id: true } }),
    ]);
    return { orchTotal, agentTotal, orchByStatus, agentByStatus };
  }
}
