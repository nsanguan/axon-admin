import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrchestratorRunDto, OrchestratorRunQueryDto } from './orchestrator.dto';
import { EventEmitter } from 'events';

export const orchestratorEmitter = new EventEmitter();

const STAGE_DEFS = [
  'Intent Analysis',
  'Plan Generation',
  'Tool Selection & Validation',
  'MCP Execution',
  'Output Validation',
  'Response Assembly',
];

@Injectable()
export class OrchestratorService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: OrchestratorRunQueryDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};
    if (query.status) where['status'] = query.status;

    const [data, total] = await Promise.all([
      this.prisma.orchestratorRun.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, name: true } }, stages: { orderBy: { stageNumber: 'asc' } } },
      }),
      this.prisma.orchestratorRun.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const run = await this.prisma.orchestratorRun.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        stages: { orderBy: { stageNumber: 'asc' } },
      },
    });
    if (!run) throw new NotFoundException('Orchestrator run not found');
    return run;
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.orchestratorRun.delete({ where: { id } });
    return { message: 'Run deleted' };
  }

  async createRun(dto: CreateOrchestratorRunDto, userId?: string) {
    const run = await this.prisma.orchestratorRun.create({
      data: {
        userId,
        prompt: dto.prompt,
        model: dto.model || 'gpt-4o',
        contextJson: dto.contextJson,
        threadId: dto.threadId || crypto.randomUUID(),
        status: 'running',
      },
    });

    // Create all 6 stages as pending
    await this.prisma.orchestratorStage.createMany({
      data: STAGE_DEFS.map((stageName, i) => ({
        runId: run.id,
        stageNumber: i + 1,
        stageName,
        status: 'pending',
      })),
    });

    // Simulate pipeline execution asynchronously
    this.runPipeline(run.id, dto).catch(console.error);

    return { runId: run.id, status: 'running' };
  }

  private async runPipeline(runId: string, dto: CreateOrchestratorRunDto) {
    const start = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const stageOutputs: Record<string, unknown>[] = [];

    const stageInputs: { prompt: string; context: unknown; user_id: string }[] = [
      { prompt: dto.prompt, context: dto.contextJson ? JSON.parse(dto.contextJson) : {}, user_id: 'system' },
    ];

    try {
      for (let i = 0; i < STAGE_DEFS.length; i++) {
        const stageName = STAGE_DEFS[i];
        const stageStart = Date.now();

        // Mark stage as running
        await this.prisma.orchestratorStage.update({
          where: { runId_stageNumber: { runId, stageNumber: i + 1 } },
          data: { status: 'running', startedAt: new Date(), inputJson: JSON.stringify(stageInputs[i] || {}) },
        });

        orchestratorEmitter.emit(runId, { type: 'stage_start', stageNumber: i + 1, stageName });

        // Simulate async stage work (50-800ms)
        const delay = 50 + Math.random() * 750;
        await new Promise((r) => setTimeout(r, delay));

        // Check for HITL in stage 4 (MCP Execution)
        if (i === 3 && dto.hitlEnabled) {
          await this.prisma.orchestratorStage.update({
            where: { runId_stageNumber: { runId, stageNumber: i + 1 } },
            data: { status: 'hitl_pending', endedAt: new Date(), durationMs: Math.round(Date.now() - stageStart) },
          });
          await this.prisma.orchestratorRun.update({
            where: { id: runId },
            data: { status: 'hitl_pending' },
          });
          orchestratorEmitter.emit(runId, { type: 'stage_complete', stageNumber: i + 1, stageName, status: 'hitl_pending' });
          return;
        }

        // Simulate stage output
        const inputTokens = Math.round(50 + Math.random() * 200);
        const outputTokens = Math.round(30 + Math.random() * 150);
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;

        const output = this.simulateStageOutput(i, dto.prompt);
        stageOutputs.push(output);

        // Build input for next stage
        if (i + 1 < STAGE_DEFS.length) {
          stageInputs.push({ prompt: String(output['summary'] ?? dto.prompt), context: output, user_id: 'system' });
        }

        await this.prisma.orchestratorStage.update({
          where: { runId_stageNumber: { runId, stageNumber: i + 1 } },
          data: {
            status: 'done',
            outputJson: JSON.stringify(output),
            endedAt: new Date(),
            durationMs: Math.round(Date.now() - stageStart),
            inputTokens,
            outputTokens,
          },
        });

        orchestratorEmitter.emit(runId, {
          type: 'stage_complete',
          stageNumber: i + 1,
          stageName,
          status: 'done',
          outputJson: JSON.stringify(output),
          durationMs: Math.round(Date.now() - stageStart),
          inputTokens,
          outputTokens,
        });
      }

      await this.prisma.orchestratorRun.update({
        where: { id: runId },
        data: {
          status: 'done',
          totalDurationMs: Date.now() - start,
          totalInputTokens,
          totalOutputTokens,
        },
      });

      orchestratorEmitter.emit(runId, { type: 'complete', status: 'done', totalDurationMs: Date.now() - start, totalInputTokens, totalOutputTokens });
    } catch (err) {
      await this.prisma.orchestratorRun.update({ where: { id: runId }, data: { status: 'error' } });
      orchestratorEmitter.emit(runId, { type: 'error', message: String(err) });
    }
  }

  private simulateStageOutput(stageIndex: number, prompt: string): Record<string, unknown> {
    const templates: Record<string, unknown>[] = [
      { intent: 'analyze', entities: ['sales', 'data'], confidence: 0.93, language: 'en' },
      { plan_id: crypto.randomUUID(), steps: [{ agent: 'data_agent', tool: 'query_db', params: {} }], estimated_tokens: 800 },
      { resolved_tools: [{ tool_id: 'query_db', plugin_id: 'axon-core', endpoint: 'http://localhost:8200', validated_params: {} }], skipped: [] },
      { results: [{ tool_id: 'query_db', status: 'ok', output: { rows: 42 }, duration_ms: 230 }] },
      { valid: true, score: 0.91, issues: [], retry_step: null, final_results: [{ rows: 42 }] },
      { response: `Analysis of "${prompt.slice(0, 60)}..." complete. Found 3 key insights.`, structured_output: { insights: 3 }, token_usage: { input: 512, output: 256, total: 768 }, duration_ms: 1200 },
    ];
    return templates[stageIndex] || {};
  }
}
