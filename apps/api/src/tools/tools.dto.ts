import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateToolDto {
  @ApiProperty({ example: 'Get Weather' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pluginId?: string;

  @ApiPropertyOptional({ description: 'JSON Schema for input' })
  @IsString()
  @IsOptional()
  inputSchemaJson?: string;

  @ApiPropertyOptional({ description: 'JSON Schema for output' })
  @IsString()
  @IsOptional()
  outputSchemaJson?: string;
}

export class UpdateToolDto extends PartialType(CreateToolDto) {}

export class ToolQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pluginId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: string;
}

export class ExecuteToolDto {
  @ApiProperty({ description: 'Input payload matching the tool input schema' })
  inputJson: object;
}
