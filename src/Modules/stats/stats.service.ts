import { REDIS_TTL } from '../../constants/index.js';
import { redisKeys } from '../../constants/redisKeys.js';
import { RedisCache, type CacheState } from '../../utils/cache.js';
import { StatsRepository, type BlogStats } from '../../Repository/stats.repository.js';

export class StatsService {
  constructor(private readonly stats = new StatsRepository()) {}

  async getStats(): Promise<{ stats: BlogStats; cache: CacheState }> {
    const cached = await RedisCache.getJSON<BlogStats>(redisKeys.stats());
    if (cached) return { stats: cached, cache: 'HIT' };

    const fresh = await this.stats.getStats();
    await RedisCache.setJSON(redisKeys.stats(), fresh, REDIS_TTL.STATS);
    return { stats: fresh, cache: 'MISS' };
  }
}
