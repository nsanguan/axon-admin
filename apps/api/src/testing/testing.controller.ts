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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { TestingService } from './testing.service';
import {
  CreateTestCollectionDto,
  CreateTestRequestDto,
  UpdateTestRequestDto,
  ExecuteTestDto,
  TestQueryDto,
} from './testing.dto';

@ApiTags('Testing')
@ApiBearerAuth()
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Get('collections')
  @ApiOperation({ summary: 'List all test collections' })
  findCollections() {
    return this.testingService.findAllCollections();
  }

  @Post('collections')
  @ApiOperation({ summary: 'Create test collection' })
  createCollection(
    @Body() dto: CreateTestCollectionDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.testingService.createCollection(dto, req.user?.id);
  }

  @Delete('collections/:id')
  @ApiOperation({ summary: 'Delete test collection' })
  deleteCollection(@Param('id') id: string) {
    return this.testingService.deleteCollection(id);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List test requests' })
  findRequests(@Query() query: TestQueryDto) {
    return this.testingService.findRequests(query);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get test request by ID with execution history' })
  findOneRequest(@Param('id') id: string) {
    return this.testingService.findOneRequest(id);
  }

  @Post('requests')
  @ApiOperation({ summary: 'Create test request' })
  createRequest(
    @Body() dto: CreateTestRequestDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.testingService.createRequest(dto, req.user?.id);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update test request' })
  updateRequest(@Param('id') id: string, @Body() dto: UpdateTestRequestDto) {
    return this.testingService.updateRequest(id, dto);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Delete test request' })
  deleteRequest(@Param('id') id: string) {
    return this.testingService.deleteRequest(id);
  }

  @Post('requests/:id/execute')
  @ApiOperation({ summary: 'Execute a test request and store the result' })
  execute(
    @Param('id') id: string,
    @Body() dto: ExecuteTestDto,
    @Req() req: Request & { user?: { id: string } },
  ) {
    return this.testingService.executeRequest(id, dto, req.user?.id);
  }
}
