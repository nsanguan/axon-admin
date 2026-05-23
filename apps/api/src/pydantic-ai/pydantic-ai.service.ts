import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiAgentRunDto, AiAgentRunQueryDto } from './pydantic-ai.dto';
import { EventEmitter } from 'events';

export const aiAgentEmitter = new EventEmitter();

// Registered mock agents for demo when sidecar is unavailable
const MOCK_AGENTS = [
  {
    name: 'DataAnalysisAgent',
    description: 'Analyzes data sets and generates structured reports',
    outputType: '{ summary: str; insights: list[str]; confidence: float }',
    tools: [{ name: 'query_database', description: 'Query the connected database' }, { name: 'compute_stats', description: 'Compute statistical summaries' }],
    instructions: 'You are a data analysis expert. Analyze the provided data and return structured insights.',
  },
  {
    name: 'CodeReviewAgent',
    description: 'Reviews code for bugs, security issues, and best practices',
    outputType: '{ issues: list[Issue]; suggestions: list[str]; score: int }',
    tools: [{ name: 'parse_code', description: 'Parse and analyze code structure' }, { name: 'check_security', description: 'Run security checks' }],
    instructions: 'You are a senior code reviewer. Identify issues and provide actionable feedback.',
  },
  {
    name: 'ResearchAgent',
    description: 'Conducts research and synthesizes information from multiple sources',
    outputType: '{ summary: str; sources: list[str]; confidence: float }',
    tools: [{ name: 'web_search', description: 'Search the web for information' }, { name: 'summarize', description: 'Summarize long texts' }],
    instructions: 'You are a research specialist. Gather and synthesize information from multiple sources.',
  },
];

@Injectable()
export class PydanticAiService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgents() {
    // Try to reach the Python sidecar; fall back to mock list
    try {
      const res = await fetch(`${process.env.AI_TESTER_URL || 'http://localhost:8210'}/agents`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return res.json();
    } catch {
      // Sidecar not available
    }
    return MOCK_AGENTS;
  }

  async getAgent(name: string) {
    try {
      const res = await fetch(`${process.env.AI_TESTER_URL || 'http://localhost:8210'}/agents/${name}`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) return res.json();
    } catch {
      // Fall through to mock
    }
    const agent = MOCK_AGENTS.find((a) => a.name === name);
    if (!agent) throw new NotFoundException(`Agent "${name}" not found`);
    return agent;
  }

  async findAll(query: AiAgentRunQueryDto) {
    const page = parseInt(query.page || '1');
    const pageSize = parseInt(query.pageSize || '20');
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = {};
    if (query.agentName) where['agentName'] = query.agentName;
    if (query.modelMode) where['modelMode'] = query.modelMode;
    if (query.status) where['status'] = query.status;

    const [data, total] = await Promise.all([
      this.prisma.aiAgentRun.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.aiAgentRun.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(id: string) {
    const run = await this.prisma.aiAgentRun.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        messages: { orderBy: { sequenceOrder: 'asc' } },
      },
    });
    if (!run) throw new NotFoundException('AI agent run not found');
    return run;
  }

  async createRun(dto: CreateAiAgentRunDto, userId?: string) {
    const run = await this.prisma.aiAgentRun.create({
      data: {
        userId,
        agentName: dto.agentName,
        modelMode: dto.modelMode,
        modelName: dto.modelName,
        prompt: dto.prompt,
        depsJson: dto.depsJson,
        usageLimitsJson: dto.usageLimitsJson,
        modelSettingsJson: dto.modelSettingsJson,
        status: 'running',
      },
    });

    // Try to delegate to Python sidecar; simulate if unavailable
    this.executeRun(run.id, dto).catch(console.error);

    return { runId: run.id, status: 'running' };
  }

  private async executeRun(runId: string, dto: CreateAiAgentRunDto) {
    const start = Date.now();
    try {
      const res = await fetch(`${process.env.AI_TESTER_URL || 'http://localhost:8210'}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId, ...dto }),
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        // Sidecar handles execution and will POST back results
        return;
      }
    } catch {
      // Sidecar not available; simulate
    }

    await this.simulateRun(runId, dto, start);
  }

  private async simulateRun(runId: string, dto: CreateAiAgentRunDto, start: number) {
    const messages = [
      { sequenceOrder: 1, messageKind: 'request', partKind: 'user-prompt', contentJson: JSON.stringify({ content: dto.prompt }) },
    ];

    const agent = MOCK_AGENTS.find((a) => a.name === dto.agentName);
    const tools = agent?.tools || [];

    // Simulate tool calls
    for (let i = 0; i < Math.min(tools.length, 2); i++) {
      const tool = tools[i];
      const toolCallId = `call_${crypto.randomUUID().slice(0, 8)}`;
      messages.push(
        { sequenceOrder: messages.length + 1, messageKind: 'response', partKind: 'tool-call', contentJson: JSON.stringify({ args: {} }), toolName: tool.name, toolCallId },
        { sequenceOrder: messages.length + 1, messageKind: 'request', partKind: 'tool-return', contentJson: JSON.stringify({ result: { rows: 42 } }), toolName: tool.name, toolCallId },
      );
      await new Promise((r) => setTimeout(r, 100 + Math.random() * 400));
      for (const msg of messages.slice(-2)) {
        await this.persistMessage(runId, msg);
        aiAgentEmitter.emit(runId, { type: 'message', message: msg });
      }
    }

    // Final response
    const textContent = `Completed analysis for "${dto.prompt.slice(0, 50)}". ${dto.modelMode === 'test_model' ? '[TestModel response]' : 'Generated 3 key insights.'}`;
    const finalMsg = { sequenceOrder: messages.length + 1, messageKind: 'response', partKind: 'text', contentJson: JSON.stringify({ content: textContent }) };
    await this.persistMessage(runId, finalMsg);
    aiAgentEmitter.emit(runId, { type: 'message', message: finalMsg });

    const inputTokens = 256 + Math.round(Math.random() * 200);
    const outputTokens = 128 + Math.round(Math.random() * 150);

    await this.prisma.aiAgentRun.update({
      where: { id: runId },
      data: {
        status: 'done',
        outputJson: JSON.stringify({ result: textContent }),
        totalDurationMs: Date.now() - start,
        inputTokens,
        outputTokens,
      },
    });

    aiAgentEmitter.emit(runId, { type: 'complete', status: 'done', inputTokens, outputTokens, totalDurationMs: Date.now() - start });
  }

  private async persistMessage(runId: string, msg: Record<string, unknown>) {
    return this.prisma.aiAgentMessage.create({
      data: {
        runId,
        sequenceOrder: msg['sequenceOrder'] as number,
        messageKind: msg['messageKind'] as string,
        partKind: msg['partKind'] as string,
        contentJson: msg['contentJson'] as string | undefined,
        toolName: msg['toolName'] as string | undefined,
        toolCallId: msg['toolCallId'] as string | undefined,
      },
    });
  }
}
