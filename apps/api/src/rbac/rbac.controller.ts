import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RbacService } from './rbac.service';

@ApiTags('Users & RBAC')
@ApiBearerAuth()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin)' })
  findUsers(@Query() query: Record<string, string>) {
    return this.rbacService.findUsers(query);
  }

  @Patch('users/:id/toggle-active')
  @ApiOperation({ summary: 'Toggle user active state' })
  toggleUser(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.rbacService.toggleUserActive(id, body.isActive);
  }

  @Get('roles')
  @ApiOperation({ summary: 'List all roles' })
  findRoles() {
    return this.rbacService.findRoles();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  createRole(@Body() body: { name: string; description?: string }) {
    return this.rbacService.createRole(body.name, body.description);
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id);
  }

  @Post('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbacService.assignRole(userId, roleId);
  }

  @Delete('users/:userId/roles/:roleId')
  @ApiOperation({ summary: 'Remove role from user' })
  removeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    return this.rbacService.removeRole(userId, roleId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'List all permissions' })
  findPermissions() {
    return this.rbacService.findPermissions();
  }
}
