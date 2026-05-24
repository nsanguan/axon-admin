import {
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';

interface AuthReq extends Request { user: { id: string } }

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with filters and pagination' })
  findAll(@Query() query: Record<string, string>) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@Req() req: AuthReq) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update own profile' })
  updateMe(@Req() req: AuthReq, @Body() body: { name?: string; avatar?: string }) {
    return this.usersService.updateUser(req.user.id, body);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change own password' })
  changePassword(
    @Req() req: AuthReq,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Post('me/mfa/setup')
  @ApiOperation({ summary: 'Start TOTP 2FA setup for current user' })
  beginMfaSetup(@Req() req: AuthReq) {
    return this.usersService.beginMfaSetup(req.user.id);
  }

  @Post('me/mfa/enable')
  @ApiOperation({ summary: 'Enable TOTP 2FA for current user' })
  enableMfa(
    @Req() req: AuthReq,
    @Body() body: { secret: string; token: string },
  ) {
    return this.usersService.enableMfa(req.user.id, body.secret, body.token);
  }

  @Post('me/mfa/disable')
  @ApiOperation({ summary: 'Disable TOTP 2FA for current user' })
  disableMfa(
    @Req() req: AuthReq,
    @Body() body: { currentPassword: string },
  ) {
    return this.usersService.disableMfa(req.user.id, body.currentPassword);
  }

  @Get('me/sessions')
  @ApiOperation({ summary: 'List own active sessions' })
  getMySessions(@Req() req: AuthReq) {
    return this.usersService.listSessions(req.user.id);
  }

  @Delete('me/sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke own session' })
  revokeMySession(@Req() req: AuthReq, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(req.user.id, sessionId);
  }

  @Post()
  @ApiOperation({ summary: 'Create user (invite)' })
  create(@Body() body: { email: string; name: string; password: string; roleId?: string }) {
    return this.usersService.createUser(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; isActive?: boolean; avatar?: string },
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete user' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('id') id: string, @Body() body: { roleId: string }) {
    return this.usersService.assignRole(id, body.roleId);
  }

  @Delete(':id/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.usersService.removeRole(id, roleId);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'List user active sessions' })
  listSessions(@Param('id') id: string) {
    return this.usersService.listSessions(id);
  }

  @Delete(':id/sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke a user session' })
  revokeSession(@Param('id') id: string, @Param('sessionId') sessionId: string) {
    return this.usersService.revokeSession(id, sessionId);
  }

  @Get(':id/audit-logs')
  @ApiOperation({ summary: 'Get audit logs for a user' })
  auditLogs(@Param('id') id: string) {
    return this.usersService.getAuditLogs(id);
  }
}
