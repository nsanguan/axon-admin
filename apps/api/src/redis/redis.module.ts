import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Global Redis module — provides an ioredis client backed by the external
 * `axon-redis-central` container (configured via REDIS_URL env var).
 * Importing modules can inject `RedisService` directly.
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
