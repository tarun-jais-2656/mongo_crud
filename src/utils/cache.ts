import { getEnv } from '../config/env.js';
import { getRedis } from '../providers/redis/connection.js';

export type CacheState = 'HIT' | 'MISS';

/**
 * The only Redis helper. Every method logs a failure and returns a safe
 * fallback so a Redis outage never changes the API response.
 */
export class RedisCache {
  /** blog_<yourname>:<key> */
  static key(name: string): string {
    return `${getEnv().DB_NAME}:${name}`;
  }

  static async get(name: string): Promise<string | null> {
    try {
      return (await getRedis()?.get(RedisCache.key(name))) ?? null;
    } catch (err) {
      RedisCache.log(err);
      return null;
    }
  }

  static async getJSON<T>(name: string): Promise<T | null> {
    const raw = await RedisCache.get(name);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      RedisCache.log(err);
      return null;
    }
  }

  static async set(name: string, value: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds < 1) return;
    try {
      await getRedis()?.set(RedisCache.key(name), value, 'EX', ttlSeconds);
    } catch (err) {
      RedisCache.log(err);
    }
  }

  static async setJSON(name: string, value: unknown, ttlSeconds: number): Promise<void> {
    await RedisCache.set(name, JSON.stringify(value), ttlSeconds);
  }

  static async delKeys(names: string[]): Promise<void> {
    if (names.length === 0) return;
    try {
      await getRedis()?.del(...names.map((name) => RedisCache.key(name)));
    } catch (err) {
      RedisCache.log(err);
    }
  }

  /** INCR. Returns the new value, or null when Redis is unavailable. */
  static async incr(name: string): Promise<number | null> {
    try {
      const value = await getRedis()?.incr(RedisCache.key(name));
      return value ?? null;
    } catch (err) {
      RedisCache.log(err);
      return null;
    }
  }

  static async expire(name: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds < 1) return;
    try {
      await getRedis()?.expire(RedisCache.key(name), ttlSeconds);
    } catch (err) {
      RedisCache.log(err);
    }
  }

  static async ttl(name: string): Promise<number> {
    try {
      return (await getRedis()?.ttl(RedisCache.key(name))) ?? -2;
    } catch (err) {
      RedisCache.log(err);
      return -2;
    }
  }

  static async sadd(name: string, member: string, ttlSeconds: number): Promise<void> {
    try {
      const redis = getRedis();
      if (!redis) return;
      await redis.sadd(RedisCache.key(name), member);
      if (ttlSeconds >= 1) await redis.expire(RedisCache.key(name), ttlSeconds);
    } catch (err) {
      RedisCache.log(err);
    }
  }

  static async srem(name: string, member: string): Promise<void> {
    try {
      await getRedis()?.srem(RedisCache.key(name), member);
    } catch (err) {
      RedisCache.log(err);
    }
  }

  static async smembers(name: string): Promise<string[]> {
    try {
      return (await getRedis()?.smembers(RedisCache.key(name))) ?? [];
    } catch (err) {
      RedisCache.log(err);
      return [];
    }
  }

  private static log(err: unknown): void {
    console.error('Redis command failed:', err instanceof Error ? err.message : err);
  }
}
