import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByNamespace(namespace: string) {
    return this.prisma.setting.findMany({
      where: { namespace },
      orderBy: { key: 'asc' },
    });
  }

  async upsert(namespace: string, key: string, valueJson: string, userId?: string) {
    return this.prisma.setting.upsert({
      where: { namespace_key: { namespace, key } },
      update: { valueJson, updatedBy: userId },
      create: { namespace, key, valueJson, updatedBy: userId },
    });
  }

  async findAllEnvironments() {
    return this.prisma.environment.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { envVariables: true } } },
    });
  }

  async createEnvironment(name: string, slug: string) {
    return this.prisma.environment.create({ data: { name, slug } });
  }

  async findEnvVars(environmentId: string) {
    return this.prisma.envVariable.findMany({
      where: { environmentId },
      select: {
        id: true,
        key: true,
        isSecret: true,
        createdAt: true,
      },
    });
  }

  async findFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
      include: { overrides: true },
    });
  }

  async toggleFeatureFlag(id: string, isActive: boolean) {
    return this.prisma.featureFlag.update({ where: { id }, data: { isActive } });
  }
}
