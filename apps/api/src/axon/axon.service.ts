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

  // ── HITL queue ──────────────────────────────────────────────────────────
  async getHitlQueue(query: { status?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const pageSize = Math.min(100, parseInt(query.pageSize || '20'));
    // Fetch orchestrator runs that are in hitl_pending status
    const where: Record<string, unknown> = { status: query.status || 'hitl_pending' };
    const [data, total] = await Promise.all([
      this.prisma.orchestratorRun.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          stages: { orderBy: { stageNumber: 'asc' }, where: { status: 'hitl_pending' } },
          user: { select: { email: true, name: true } },
        },
      }),
      this.prisma.orchestratorRun.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async approveHitl(runId: string, decision: 'approve' | 'reject', note?: string) {
    const run = await this.prisma.orchestratorRun.findUnique({ where: { id: runId } });
    if (!run) throw new Error(`Orchestrator run ${runId} not found`);
    // Update run + pending stage
    await this.prisma.orchestratorStage.updateMany({
      where: { runId, status: 'hitl_pending' },
      data: { status: decision === 'approve' ? 'done' : 'error', errorMessage: decision === 'reject' ? note || 'Rejected by operator' : null },
    });
    await this.prisma.orchestratorRun.update({
      where: { id: runId },
      data: { status: decision === 'approve' ? 'running' : 'failed' },
    });
    return { message: decision === 'approve' ? 'Approved — pipeline resuming' : 'Rejected' };
  }

  // ── Experience Ledger (axon_brain mock — real data from cross-schema query) ──
  async getExperienceLedger(query: { search?: string; page?: string; pageSize?: string }) {
    const page = Math.max(1, parseInt(query.page || '1'));
    const pageSize = Math.min(100, parseInt(query.pageSize || '20'));
    // Return orchestrator runs as proxy for experience records until cross-schema access is configured
    const where: Record<string, unknown> = { status: 'done' };
    if (query.search) {
      where['prompt'] = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.orchestratorRun.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, prompt: true, model: true, status: true,
          totalDurationMs: true, totalInputTokens: true, totalOutputTokens: true,
          createdAt: true, user: { select: { email: true } },
        },
      }),
      this.prisma.orchestratorRun.count({ where }),
    ]);
    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}
