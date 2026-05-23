import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PydanticAiService, aiAgentEmitter } from './pydantic-ai.service';
import { CreateAiAgentRunDto, AiAgentRunQueryDto } from './pydantic-ai.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Pydantic AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pydantic-ai')
export class PydanticAiController {
  constructor(private readonly pydanticAiService: PydanticAiService) {}

  @Get('agents')
  @ApiOperation({ summary: 'List all registered agents' })
  listAgents() {
    return this.pydanticAiService.listAgents();
  }

  @Get('agents/:name')
  @ApiOperation({ summary: 'Get agent schema (tools, output type, instructions)' })
  getAgent(@Param('name') name: string) {
    return this.pydanticAiService.getAgent(name);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Paginated agent run history' })
  findAll(@Query() query: AiAgentRunQueryDto) {
    return this.pydanticAiService.findAll(query);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get full run with all messages' })
  findOne(@Param('id') id: string) {
    return this.pydanticAiService.findOne(id);
  }

  @Post('runs')
  @ApiOperation({ summary: 'Start a new agent test run' })
  createRun(
    @Body() dto: CreateAiAgentRunDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.pydanticAiService.createRun(dto, req.user?.id);
  }

  @Get('runs/:id/stream')
  @ApiOperation({ summary: 'SSE stream — message exchange events' })
  stream(@Param('id') id: string, @Res() res: Response, @Req() req: Request) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    aiAgentEmitter.on(id, send);

    req.on('close', () => {
      aiAgentEmitter.off(id, send);
    });

    // Send current state immediately
    this.pydanticAiService.findOne(id).then((run) => {
      send({ type: 'snapshot', run });
    }).catch(() => {
      send({ type: 'error', message: 'Run not found' });
      res.end();
    });
  }
}
