---
name: realtime-websocket
description: Implement real-time features using WebSocket (Socket.io), Server-Sent Events (SSE), and Redis pub/sub with BullMQ for the AXON Admin platform. Use when adding live log streaming, real-time dashboard metrics, notification broadcasts, MCP streaming responses, or any push-based update to the UI.
---

# Real-Time WebSocket & SSE — AXON Admin

## Architecture

```
NestJS WebSocket Gateway (Socket.io)
       ↑
Redis Pub/Sub  ←  BullMQ Workers
       ↑                ↑
  Log events       Notification jobs
  Metric events    Health check jobs
```

## Step 1: Socket.io Setup (NestJS)

### Install dependencies

```bash
pnpm --filter api add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm --filter api add @nestjs/bull bull ioredis
pnpm --filter api add -D @types/bull
```

### App-wide WebSocket Gateway

```typescript
// apps/api/src/realtime/realtime.gateway.ts
import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private readonly jwt: JwtService) {}

  afterInit() { this.logger.log('WebSocket gateway initialized'); }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      const payload = this.jwt.verify(token);
      client.data.user = payload;
      // Join user-specific room for targeted notifications
      client.join(`user:${payload.sub}`);
      // Join role rooms
      for (const role of payload.roles ?? []) client.join(`role:${role}`);
      this.logger.log(`Client connected: ${client.id} (${payload.email})`);
    } catch {
      client.disconnect(true); // reject unauthenticated connections
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to log stream for a specific level filter
  @SubscribeMessage('logs:subscribe')
  handleLogSubscribe(@MessageBody() { levels }: { levels: string[] }, @ConnectedSocket() client: Socket) {
    for (const level of ['ERROR', 'WARN', 'INFO', 'HTTP', 'DEBUG']) client.leave(`log:${level}`);
    for (const level of levels) client.join(`log:${level}`);
    return { subscribed: levels };
  }

  // Broadcast a log entry to subscribers
  broadcastLog(log: { level: string; message: string; createdAt: Date; contextJson?: unknown }) {
    this.server.to(`log:${log.level}`).emit('logs:entry', log);
  }

  // Broadcast metric update to all authenticated clients
  broadcastMetrics(metrics: Record<string, unknown>) {
    this.server.emit('metrics:update', metrics);
  }

  // Send notification to specific user
  sendNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  // Broadcast system alert to all admins
  broadcastAlert(alert: unknown) {
    this.server.to('role:admin').to('role:super_admin').emit('system:alert', alert);
  }
}
```

## Step 2: Redis Integration

```typescript
// apps/api/src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [{
    provide: REDIS_CLIENT,
    useFactory: () => new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    }),
  }],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

```typescript
// apps/api/src/realtime/realtime.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimeService {
  private readonly subscriber: Redis;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly gateway: RealtimeGateway,
  ) {
    // Create a duplicate connection for subscribe mode
    this.subscriber = this.redis.duplicate();
    this.setupSubscriptions();
  }

  private async setupSubscriptions() {
    await this.subscriber.subscribe('axon:logs', 'axon:metrics', 'axon:notifications');
    this.subscriber.on('message', (channel, message) => {
      const data = JSON.parse(message);
      if (channel === 'axon:logs') this.gateway.broadcastLog(data);
      if (channel === 'axon:metrics') this.gateway.broadcastMetrics(data);
      if (channel === 'axon:notifications') this.gateway.sendNotification(data.userId, data.notification);
    });
  }

  async publishLog(log: unknown) {
    await this.redis.publish('axon:logs', JSON.stringify(log));
  }

  async publishMetrics(metrics: unknown) {
    await this.redis.publish('axon:metrics', JSON.stringify(metrics));
  }

  async publishNotification(userId: string, notification: unknown) {
    await this.redis.publish('axon:notifications', JSON.stringify({ userId, notification }));
  }
}
```

## Step 3: BullMQ Jobs

```typescript
// apps/api/src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MetricsProcessor } from './processors/metrics.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { HealthCheckProcessor } from './processors/health-check.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        redis: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'metrics' },
      { name: 'notifications' },
      { name: 'health-checks' },
    ),
  ],
  providers: [MetricsProcessor, NotificationProcessor, HealthCheckProcessor],
  exports: [BullModule],
})
export class JobsModule {}
```

```typescript
// apps/api/src/jobs/processors/metrics.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { RealtimeService } from '../../realtime/realtime.service';
import { DashboardService } from '../../dashboard/dashboard.service';

@Processor('metrics')
export class MetricsProcessor {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly dashboard: DashboardService,
  ) {}

  @Process('collect-and-broadcast')
  async handle(_job: Job) {
    const metrics = await this.dashboard.getKpiMetrics();
    await this.realtime.publishMetrics(metrics);
  }
}
```

```typescript
// Schedule repeating jobs in AppModule:
// apps/api/src/app/app.module.ts
import { BullModule } from '@nestjs/bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OnModuleInit } from '@nestjs/common';

// In AppService or a dedicated SchedulerService:
export class SchedulerService implements OnModuleInit {
  constructor(@InjectQueue('metrics') private readonly metricsQueue: Queue) {}

  async onModuleInit() {
    // Broadcast metrics every 5 seconds
    await this.metricsQueue.add('collect-and-broadcast', {}, {
      repeat: { every: 5000 },
      removeOnComplete: true,
    });
  }
}
```

## Step 4: Winston Logger with Realtime Broadcast

```typescript
// apps/api/src/logger/realtime-transport.ts
import Transport from 'winston-transport';
import { RealtimeService } from '../realtime/realtime.service';

export class RealtimeTransport extends Transport {
  constructor(private readonly realtime: RealtimeService, opts?: Transport.TransportStreamOptions) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.realtime.publishLog({
        level: info.level.toUpperCase(),
        message: info.message,
        contextJson: info.context ?? null,
        createdAt: new Date().toISOString(),
      });
    });
    callback();
  }
}
```

```typescript
// apps/api/src/logger/logger.module.ts
import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: (realtime: RealtimeService) => ({
        transports: [
          new winston.transports.Console({ format: winston.format.combine(
            winston.format.colorize(), winston.format.simple(),
          )}),
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new RealtimeTransport(realtime, { level: 'info' }),
        ],
      }),
      inject: [RealtimeService],
    }),
  ],
})
export class LoggerModule {}
```

## Step 5: Frontend — Socket.io Client

```typescript
// apps/web/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

```typescript
// apps/web/hooks/use-live-logs.ts
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';

export interface LogEntry {
  level: string;
  message: string;
  createdAt: string;
  contextJson?: unknown;
}

export function useLiveLogs(levels: string[] = ['ERROR', 'WARN', 'INFO']) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!(session as any)?.accessToken) return;
    const socket = getSocket((session as any).accessToken);

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('logs:subscribe', { levels });
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('logs:entry', (log: LogEntry) => {
      setLogs(prev => [log, ...prev].slice(0, 5000)); // keep last 5000
    });

    return () => {
      socket.off('logs:entry');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [session, levels.join(',')]);

  const clear = useCallback(() => setLogs([]), []);

  return { logs, isConnected, clear };
}
```

```typescript
// apps/web/hooks/use-live-metrics.ts
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';

export function useLiveMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!(session as any)?.accessToken) return;
    const socket = getSocket((session as any).accessToken);
    socket.on('metrics:update', (data: Record<string, unknown>) => setMetrics(data));
    return () => { socket.off('metrics:update'); };
  }, [session]);

  return metrics;
}
```

```typescript
// apps/web/hooks/use-notifications-socket.ts
'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socket';

export function useNotificationsSocket() {
  const { data: session } = useSession();
  const qc = useQueryClient();

  useEffect(() => {
    if (!(session as any)?.accessToken) return;
    const socket = getSocket((session as any).accessToken);

    socket.on('notification:new', (notification: any) => {
      toast(notification.title, { description: notification.message });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => { socket.off('notification:new'); };
  }, [session, qc]);
}
```

## Step 6: SSE Endpoint (Alternative to WebSocket for logs)

```typescript
// apps/api/src/logs/logs.controller.ts — SSE stream endpoint
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  @Get('stream')
  stream(@Req() req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const subscriber = new Redis(/* same config */);
    subscriber.subscribe('axon:logs');
    subscriber.on('message', (_, message) => {
      res.write(`data: ${message}\n\n`);
    });

    req.on('close', () => {
      subscriber.disconnect();
      res.end();
    });
  }
}
```

## Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

## Rules

- WebSocket connections are rejected immediately if JWT token is missing or invalid
- Use `socket.join(room)` for targeted broadcasts — never iterate all connections manually
- BullMQ jobs are used for all async side effects (notifications, health checks, metric collection)
- Redis pub/sub subscriber uses a **duplicate** connection — never reuse the main Redis client for subscribe mode
- Frontend sockets use a singleton (`getSocket`) — never create multiple socket instances
- Live log viewer keeps a maximum of 5,000 entries in memory — virtualize the DOM list with TanStack Virtual
- SSE streams must clean up Redis subscriber on `req.close` to avoid connection leaks
