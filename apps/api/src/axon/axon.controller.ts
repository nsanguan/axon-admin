import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AxonService } from './axon.service';

@ApiTags('Axon System')
@ApiBearerAuth()
@Controller('axon')
export class AxonController {
  constructor(private readonly axonService: AxonService) {}

  @Get('stats')
  @ApiOperation({ summary: 'AXON system stats' })
  getStats() {
    return this.axonService.getStats();
  }

  @Get('orchestrator-runs')
  @ApiOperation({ summary: 'List orchestrator runs' })
  findOrchestratorRuns(@Query() query: Record<string, string>) {
    return this.axonService.findOrchestratorRuns(query);
  }

  @Get('orchestrator-runs/:id')
  @ApiOperation({ summary: 'Get orchestrator run detail with stages' })
  getOrchestratorRunDetail(@Param('id') id: string) {
    return this.axonService.getOrchestratorRunDetail(id);
  }

  @Get('ai-agent-runs')
  @ApiOperation({ summary: 'List AI agent runs' })
  findAiAgentRuns(@Query() query: Record<string, string>) {
    return this.axonService.findAiAgentRuns(query);
  }

  // ── HITL queue ─────────────────────────────────────────────────────────

  @Get('hitl')
  @ApiOperation({ summary: 'Get HITL approval queue' })
  getHitlQueue(@Query() query: Record<string, string>) {
    return this.axonService.getHitlQueue(query);
  }

  @Post('hitl/:runId/approve')
  @ApiOperation({ summary: 'Approve a HITL decision' })
  approveHitl(@Param('runId') runId: string, @Body() body: { note?: string }) {
    return this.axonService.approveHitl(runId, 'approve', body?.note);
  }

  @Post('hitl/:runId/reject')
  @ApiOperation({ summary: 'Reject a HITL decision' })
  rejectHitl(@Param('runId') runId: string, @Body() body: { note?: string }) {
    return this.axonService.approveHitl(runId, 'reject', body?.note);
  }

  // ── Experience Ledger ──────────────────────────────────────────────────

  @Get('experience')
  @ApiOperation({ summary: 'Browse experience ledger records' })
  getExperienceLedger(@Query() query: Record<string, string>) {
    return this.axonService.getExperienceLedger(query);
  }
}
