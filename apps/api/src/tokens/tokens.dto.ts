import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiTokenDto {
  @ApiProperty({ example: 'My Integration Token' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Expiry date ISO string, null = never expires' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Allowed scopes e.g. ["plugins:read","tools:execute"]' })
  @IsArray()
  @IsOptional()
  scopes?: string[];
}
