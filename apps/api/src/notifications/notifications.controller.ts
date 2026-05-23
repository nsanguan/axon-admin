import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';

interface AuthReq extends Request { user: { id: string } }

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  findAll(@Req() req: AuthReq, @Query('unread') unread?: string) {
    return this.notificationsService.findAll(req.user.id, unread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@Req() req: AuthReq) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string, @Req() req: AuthReq) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@Req() req: AuthReq) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string, @Req() req: AuthReq) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }

  // ── Notification Rules ─────────────────────────────────────────────────

  @Get('rules')
  @ApiOperation({ summary: 'List notification rules' })
  getRules(@Req() req: AuthReq) {
    return this.notificationsService.getRules(req.user.id);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create notification rule' })
  createRule(
    @Req() req: AuthReq,
    @Body() body: { eventType: string; conditionJson?: string; channelsJson?: string; isActive?: boolean },
  ) {
    return this.notificationsService.createRule(req.user.id, body);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update notification rule' })
  updateRule(
    @Param('id') id: string,
    @Req() req: AuthReq,
    @Body() body: { isActive?: boolean; channelsJson?: string; conditionJson?: string },
  ) {
    return this.notificationsService.updateRule(id, req.user.id, body);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete notification rule' })
  deleteRule(@Param('id') id: string, @Req() req: AuthReq) {
    return this.notificationsService.deleteRule(id, req.user.id);
  }
}
