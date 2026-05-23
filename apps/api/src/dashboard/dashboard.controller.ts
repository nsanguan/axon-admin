import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get KPI metrics for dashboard widgets' })
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('daily-usage')
  @ApiOperation({ summary: 'Get daily usage chart data' })
  getDailyUsage(@Query('days') days?: string) {
    return this.dashboardService.getDailyUsage(days ? parseInt(days) : 7);
  }
}
