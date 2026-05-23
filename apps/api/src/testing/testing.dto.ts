import { IsString, IsOptional, IsIn, IsObject, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateTestCollectionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateTestRequestDto {
  @ApiProperty()
  @IsString()
  collectionId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ['mcp', 'http', 'sse'] })
  @IsIn(['mcp', 'http', 'sse'])
  protocol: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  method?: string;

  @ApiPropertyOptional({ description: 'JSON headers' })
  @IsString()
  @IsOptional()
  headersJson?: string;

  @ApiPropertyOptional({ description: 'JSON body/payload' })
  @IsString()
  @IsOptional()
  bodyJson?: string;
}

export class UpdateTestRequestDto extends PartialType(CreateTestRequestDto) {}

export class ExecuteTestDto {
  @ApiPropertyOptional({ description: 'Override endpoint' })
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Override headers JSON' })
  @IsString()
  @IsOptional()
  headersJson?: string;

  @ApiPropertyOptional({ description: 'Override body JSON' })
  @IsString()
  @IsOptional()
  bodyJson?: string;
}

export class TestQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  collectionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: string;
}
