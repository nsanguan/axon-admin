import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateAiAgentRunDto {
  @ApiProperty({ example: 'DataAnalysisAgent' })
  @IsString()
  agentName: string;

  @ApiProperty({ enum: ['test_model', 'function_model', 'real_model'] })
  @IsString()
  modelMode: string;

  @ApiPropertyOptional({ example: 'gpt-4o' })
  @IsOptional()
  @IsString()
  modelName?: string;

  @ApiProperty({ example: 'Summarize the monthly KPIs' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ example: '{}' })
  @IsOptional()
  @IsString()
  depsJson?: string;

  @ApiPropertyOptional({ example: '{"request_limit": 10}' })
  @IsOptional()
  @IsString()
  usageLimitsJson?: string;

  @ApiPropertyOptional({ example: '{"temperature": 0.7}' })
  @IsOptional()
  @IsString()
  modelSettingsJson?: string;

  @ApiPropertyOptional({ description: 'Python snippet for FunctionModel mode' })
  @IsOptional()
  @IsString()
  functionSnippet?: string;
}

export class AiAgentRunQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  modelMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pageSize?: string;
}
