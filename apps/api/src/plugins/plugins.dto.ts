import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreatePluginDto {
  @ApiProperty({ example: 'Weather Plugin' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://weather-mcp.example.com' })
  @IsUrl()
  endpoint: string;

  @ApiPropertyOptional({ enum: ['none', 'api_key', 'bearer', 'basic'], default: 'none' })
  @IsIn(['none', 'api_key', 'bearer', 'basic'])
  @IsOptional()
  authMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apiKeyEncrypted?: string;

  @ApiPropertyOptional({ description: 'JSON string of custom headers' })
  @IsString()
  @IsOptional()
  headersJson?: string;

  @ApiPropertyOptional({ default: 30000 })
  @IsInt()
  @Min(1000)
  @Max(300000)
  @IsOptional()
  timeoutMs?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  retryPolicyJson?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupId?: string;
}

export class UpdatePluginDto extends PartialType(CreatePluginDto) {}

export class PluginQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'error'] })
  @IsIn(['active', 'inactive', 'error'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ default: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ default: '20' })
  @IsOptional()
  pageSize?: string;
}
