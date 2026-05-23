import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Wraps an ioredis client connected to the external Redis instance.
 * Connection string is taken from the REDIS_URL environment variable
 * (default: redis://localhost:6379 for local dev).
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit(): void {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.client = new Redis(url, {
      // Reconnect with exponential back-off capped at 10 s
      retryStrategy: (times: number) => Math.min(times * 200, 10_000),
      lazyConnect: false,
      maxRetriesPerRequest: null, // Required by BullMQ
    });
    this.client.on('connect', () =>
      this.logger.log(`Connected to Redis at ${url}`),
    );
    this.client.on('error', (err: Error) =>
      this.logger.error('Redis error', err.message),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
  }

  /** Returns the underlying ioredis client for direct use or BullMQ. */
  getClient(): Redis {
    return this.client;
  }

  // ── Common helpers ─────────────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(...keys: string[]): Promise<void> {
    await this.client.del(...keys);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  /** Creates a **duplicate** connection suitable for SUBSCRIBE mode. */
  createSubscriber(): Redis {
    return this.client.duplicate();
  }
}
