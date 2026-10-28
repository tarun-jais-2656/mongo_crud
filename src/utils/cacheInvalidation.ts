import { redisKeys } from '../constants/redisKeys.js';
import { RedisCache } from './cache.js';

/** MongoDB is written first. These calls only drop the fast copy. */
export class CacheInvalidation {
  static async postChanged(postId: string): Promise<void> {
    await RedisCache.delKeys([redisKeys.post(postId)]);
    await RedisCache.incr(redisKeys.postListVersion());
    await RedisCache.incr(redisKeys.commentVersion(postId));
  }

  static async listChanged(): Promise<void> {
    await RedisCache.incr(redisKeys.postListVersion());
  }
}
