import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OrchestratorService, orchestratorEmitter } from './orchestrator.service';
import { CreateOrchestratorRunDto, OrchestratorRunQueryDto } from './orchestrator.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orchestrator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Get('runs')
  @ApiOperation({ summary: 'List orchestrator pipeline runs' })
  findAll(@Query() query: OrchestratorRunQueryDto) {
    return this.orchestratorService.findAll(query);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get run detail with all stage snapshots' })
  findOne(@Param('id') id: string) {
    return this.orchestratorService.findOne(id);
  }

  @Post('run')
  @ApiOperation({ summary: 'Start a new orchestrator pipeline run' })
  createRun(
    @Body() dto: CreateOrchestratorRunDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.orchestratorService.createRun(dto, req.user?.id);
  }

  @Delete('runs/:id')
  @ApiOperation({ summary: 'Delete a run record' })
  delete(@Param('id') id: string) {
    return this.orchestratorService.delete(id);
  }

  @Get('runs/:id/stream')
  @ApiOperation({ summary: 'SSE stream — stage completion events' })
  stream(@Param('id') id: string, @Res() res: Response, @Req() req: import('express').Request) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    orchestratorEmitter.on(id, send);

    req.on('close', () => {
      orchestratorEmitter.off(id, send);
    });

    // Send current state immediately
    this.orchestratorService.findOne(id).then((run) => {
      send({ type: 'snapshot', run });
    }).catch(() => {
      send({ type: 'error', message: 'Run not found' });
      res.end();
    });
  }
}
