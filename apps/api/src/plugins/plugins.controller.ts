import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PluginsService } from './plugins.service';
import { CreatePluginDto, UpdatePluginDto, PluginQueryDto } from './plugins.dto';

@ApiTags('Plugins')
@ApiBearerAuth()
@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  @ApiOperation({ summary: 'List all plugins with pagination and filtering' })
  findAll(@Query() query: PluginQueryDto) {
    return this.pluginsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plugin by ID' })
  findOne(@Param('id') id: string) {
    return this.pluginsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plugin' })
  create(
    @Body() dto: CreatePluginDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.pluginsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plugin' })
  update(@Param('id') id: string, @Body() dto: UpdatePluginDto) {
    return this.pluginsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a plugin' })
  remove(@Param('id') id: string) {
    return this.pluginsService.remove(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Check plugin MCP health endpoint' })
  checkHealth(@Param('id') id: string) {
    return this.pluginsService.checkHealth(id);
  }
}
