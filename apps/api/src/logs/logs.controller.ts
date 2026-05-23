import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LogsService } from './logs.service';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get('audit')
  @ApiOperation({ summary: 'List audit logs' })
  findAudit(@Query() query: Record<string, string>) {
    return this.logsService.findAuditLogs(query);
  }

  @Get('system')
  @ApiOperation({ summary: 'List system logs' })
  findSystem(@Query() query: Record<string, string>) {
    return this.logsService.findSystemLogs(query);
  }

  @Get('execution')
  @ApiOperation({ summary: 'List execution logs' })
  findExecution(@Query() query: Record<string, string>) {
    return this.logsService.findExecutionLogs(query);
  }
}
