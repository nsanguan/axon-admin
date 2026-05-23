import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getData() {
    return this.appService.getData();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
