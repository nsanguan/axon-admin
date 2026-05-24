import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@axon.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '123456', required: false, description: 'Required when 2FA is enabled on the account' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Authenticator code must be 6 digits' })
  totpCode?: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@axon.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
