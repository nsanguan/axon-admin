import { Controller, Get, Post, Patch, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get settings by namespace' })
  findByNamespace(@Query('namespace') namespace: string) {
    return this.settingsService.findByNamespace(namespace || 'general');
  }

  @Post()
  @ApiOperation({ summary: 'Upsert a setting value' })
  upsert(
    @Body() body: { namespace: string; key: string; valueJson: string },
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.settingsService.upsert(body.namespace, body.key, body.valueJson, req.user?.id);
  }

  @Get('environments')
  @ApiOperation({ summary: 'List environments' })
  findEnvironments() {
    return this.settingsService.findAllEnvironments();
  }

  @Post('environments')
  @ApiOperation({ summary: 'Create environment' })
  createEnvironment(@Body() body: { name: string; slug: string }) {
    return this.settingsService.createEnvironment(body.name, body.slug);
  }

  @Get('environments/:id/vars')
  @ApiOperation({ summary: 'List env variables for environment' })
  findEnvVars(@Param('id') id: string) {
    return this.settingsService.findEnvVars(id);
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'List all feature flags' })
  findFeatureFlags() {
    return this.settingsService.findFeatureFlags();
  }

  @Patch('feature-flags/:id/toggle')
  @ApiOperation({ summary: 'Toggle feature flag active state' })
  toggleFlag(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.settingsService.toggleFeatureFlag(id, body.isActive);
  }
}
