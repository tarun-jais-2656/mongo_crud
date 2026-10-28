import { LOGIN_MAX_FAILURES, REDIS_TTL } from '../constants/index.js';
import { redisKeys } from '../constants/redisKeys.js';
import { tooManyRequests } from '../utils/AppError.js';
import { RedisCache } from '../utils/cache.js';

/**
 * Login failures stored in Redis.
 * login:fail:<email> and login:fail:ip:<ip> are counters with a 15 minute TTL.
 * If Redis is down, the limit is skipped and login still works.
 */
export class LoginThrottle {
  async assertAllowed(email: string, ip: string): Promise<void> {
    const emailCount = await this.count(redisKeys.loginFailEmail(email));
    const ipCount = await this.count(redisKeys.loginFailIp(ip));
    const blocked = emailCount >= LOGIN_MAX_FAILURES || ipCount >= LOGIN_MAX_FAILURES;
    if (!blocked) return;

    const emailTtl = await RedisCache.ttl(redisKeys.loginFailEmail(email));
    const ipTtl = await RedisCache.ttl(redisKeys.loginFailIp(ip));
    const seconds = Math.max(emailTtl, ipTtl, 0);
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    throw tooManyRequests(`Too many login attempts. Try again in ${minutes} minutes`);
  }

  async recordFailure(email: string, ip: string): Promise<void> {
    await this.bump(redisKeys.loginFailEmail(email));
    await this.bump(redisKeys.loginFailIp(ip));
  }

  async clear(email: string, ip: string): Promise<void> {
    await RedisCache.delKeys([redisKeys.loginFailEmail(email), redisKeys.loginFailIp(ip)]);
  }

  private async count(name: string): Promise<number> {
    const raw = await RedisCache.get(name);
    const count = raw === null ? 0 : Number(raw);
    return Number.isFinite(count) ? count : 0;
  }

  private async bump(name: string): Promise<void> {
    const count = await RedisCache.incr(name);
    if (count === 1) await RedisCache.expire(name, REDIS_TTL.LOGIN_WINDOW);
  }
}

export const loginThrottle = new LoginThrottle();
