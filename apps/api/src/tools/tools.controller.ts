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
import { ToolsService } from './tools.service';
import { CreateToolDto, UpdateToolDto, ToolQueryDto, ExecuteToolDto } from './tools.dto';

@ApiTags('Tools')
@ApiBearerAuth()
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'List all tools' })
  findAll(@Query() query: ToolQueryDto) {
    return this.toolsService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all tool categories' })
  getCategories() {
    return this.toolsService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tool by ID' })
  findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tool' })
  create(
    @Body() dto: CreateToolDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.toolsService.create(dto, req.user?.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tool' })
  update(@Param('id') id: string, @Body() dto: UpdateToolDto) {
    return this.toolsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a tool' })
  remove(@Param('id') id: string) {
    return this.toolsService.remove(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a tool and capture the execution log' })
  execute(
    @Param('id') id: string,
    @Body() dto: ExecuteToolDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.toolsService.execute(id, dto.inputJson, req.user?.id);
  }
}
