import { Controller, Get, Patch, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  findAll(
    @Req() req: Request & { user: { id: string } },
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.findAll(req.user.id, unread === 'true');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@Req() req: Request & { user: { id: string } }) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(
    @Param('id') id: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@Req() req: Request & { user: { id: string } }) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
