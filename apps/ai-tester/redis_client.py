"""Async Redis client for the AXON AI Tester sidecar.

Uses the external `axon-redis-central` container via REDIS_URL env var.
Default falls back to localhost:6379 for local development.

Usage:
    from redis_client import get_redis, close_redis

    async with get_redis() as r:
        await r.set("key", "value", ex=60)
        val = await r.get("key")
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import redis.asyncio as aioredis

REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

# Module-level singleton (initialised in lifespan)
_pool: aioredis.ConnectionPool | None = None


def init_redis_pool() -> None:
    """Initialise the connection pool.  Call once at application startup."""
    global _pool
    _pool = aioredis.ConnectionPool.from_url(
        REDIS_URL,
        max_connections=10,
        decode_responses=True,
    )


async def close_redis_pool() -> None:
    """Drain and close the connection pool.  Call at application shutdown."""
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None


@asynccontextmanager
async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    """Async context manager that yields a Redis client from the pool."""
    if _pool is None:
        raise RuntimeError(
            "Redis pool is not initialised — call init_redis_pool() first."
        )
    client: aioredis.Redis = aioredis.Redis(connection_pool=_pool)
    try:
        yield client
    finally:
        await client.aclose()
