import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, unreadOnly?: boolean) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async deleteNotification(id: string, userId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  // ── Notification Rules ─────────────────────────────────────────────────

  async getRules(userId: string) {
    return this.prisma.notificationRule.findMany({
      where: { createdBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(
    userId: string,
    data: { eventType: string; conditionJson?: string; channelsJson?: string; isActive?: boolean },
  ) {
    return this.prisma.notificationRule.create({
      data: {
        eventType: data.eventType,
        conditionJson: data.conditionJson || '{}',
        channelsJson: data.channelsJson || '["in_app"]',
        isActive: data.isActive ?? true,
        createdBy: userId,
      },
    });
  }

  async updateRule(id: string, userId: string, data: { isActive?: boolean; channelsJson?: string; conditionJson?: string }) {
    const rule = await this.prisma.notificationRule.findFirst({ where: { id, createdBy: userId } });
    if (!rule) throw new NotFoundException('Rule not found');
    return this.prisma.notificationRule.update({ where: { id }, data });
  }

  async deleteRule(id: string, userId: string) {
    const rule = await this.prisma.notificationRule.findFirst({ where: { id, createdBy: userId } });
    if (!rule) throw new NotFoundException('Rule not found');
    await this.prisma.notificationRule.delete({ where: { id } });
    return { message: 'Rule deleted' };
  }

  async createNotification(userId: string, type: string, title: string, message: string, dataJson?: string) {
    return this.prisma.notification.create({
      data: { userId, type, title, message, dataJson },
    });
  }
}
