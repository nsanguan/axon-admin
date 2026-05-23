import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from '../redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { PluginsModule } from '../plugins/plugins.module';
import { ToolsModule } from '../tools/tools.module';
import { TestingModule } from '../testing/testing.module';
import { TokensModule } from '../tokens/tokens.module';
import { LogsModule } from '../logs/logs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { RbacModule } from '../rbac/rbac.module';
import { AxonModule } from '../axon/axon.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PydanticAiModule } from '../pydantic-ai/pydantic-ai.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL_MS || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    // ── External Redis via ioredis ─────────────────────────────────────
    RedisModule,
    // ── BullMQ — queue workers backed by external Redis ───────────────
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
        maxRetriesPerRequest: null, // Required by BullMQ
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    PluginsModule,
    ToolsModule,
    TestingModule,
    TokensModule,
    LogsModule,
    NotificationsModule,
    SettingsModule,
    RbacModule,
    AxonModule,
    OrchestratorModule,
    PydanticAiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
