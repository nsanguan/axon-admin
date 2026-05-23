import { Controller, Get, Post, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { TokensService } from './tokens.service';
import { CreateApiTokenDto } from './tokens.dto';

@ApiTags('API Tokens')
@ApiBearerAuth()
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get()
  @ApiOperation({ summary: 'List all API tokens for the current user' })
  findAll(@Req() req: Request & { user: { id: string } }) {
    return this.tokensService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API token (raw token shown once)' })
  create(
    @Body() dto: CreateApiTokenDto,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.tokensService.create(dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API token' })
  revoke(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.tokensService.revoke(id, req.user.id);
  }
}
