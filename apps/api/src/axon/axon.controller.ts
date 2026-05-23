import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
