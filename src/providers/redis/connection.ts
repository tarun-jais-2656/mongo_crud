import { Redis } from 'ioredis';
import { getEnv } from '../../config/env.js';

let client: Redis | undefined;

/**
 * One shared ioredis connection. Commands fail fast when Redis is down so the
 * API can keep serving from MongoDB.
 */
export const connectRedis = async (): Promise<Redis> => {
  const redis = new Redis(getEnv().REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  redis.on('error', (err: Error) => {
    console.error('Redis error:', err.message);
  });

  await redis.connect();
  client = redis;
  console.log('Redis connected');
  return redis;
};

export const getRedis = (): Redis | undefined => client;

export const disconnectRedis = async (): Promise<void> => {
  if (!client) return;
  await client.quit();
  client = undefined;
};
