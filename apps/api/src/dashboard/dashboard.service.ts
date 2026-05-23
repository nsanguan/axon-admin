import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [
      pluginCount,
      toolCount,
      totalExecutions,
      failedExecutions,
      systemLogErrors,
      activeUsers,
    ] = await Promise.all([
      this.prisma.plugin.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.tool.count({ where: { deletedAt: null } }),
      this.prisma.toolExecutionLog.count(),
      this.prisma.toolExecutionLog.count({ where: { status: 'error' } }),
      this.prisma.systemLog.count({ where: { level: 'ERROR' } }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    const errorRate = totalExecutions > 0
      ? Math.round((failedExecutions / totalExecutions) * 100 * 10) / 10
      : 0;

    return {
      plugins: { active: pluginCount },
      tools: { total: toolCount },
      requests: { total: totalExecutions, failed: failedExecutions, errorRate },
      system: { errors: systemLogErrors },
      users: { active: activeUsers },
      updatedAt: new Date().toISOString(),
    };
  }

  async getDailyUsage(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.toolExecutionLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    });

    const map: Record<string, { date: string; total: number; errors: number }> = {};
    for (const log of logs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      if (!map[day]) map[day] = { date: day, total: 0, errors: 0 };
      map[day].total++;
      if (log.status === 'error') map[day].errors++;
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }
}
