import { type Types } from 'mongoose';
import { REDIS_TTL } from '../../constants/index.js';
import { redisKeys } from '../../constants/redisKeys.js';
import { notFound } from '../../utils/AppError.js';
import { RedisCache, type CacheState } from '../../utils/cache.js';
import { UserRepository } from '../../Repository/user.repository.js';
import { UserMapper, type PublicUser } from './user.mapper.js';

export class UserService {
  constructor(private readonly users = new UserRepository()) {}

  async getProfile(userId: Types.ObjectId): Promise<{ user: PublicUser; cache: CacheState }> {
    const key = redisKeys.user(userId.toString());
    const cached = await RedisCache.getJSON<PublicUser>(key);
    if (cached) return { user: cached, cache: 'HIT' };

    const user = await this.users.findById(userId);
    if (!user) throw notFound('User not found');
    const profile = UserMapper.toPublicUser(user);
    await RedisCache.setJSON(key, profile, REDIS_TTL.PROFILE);
    return { user: profile, cache: 'MISS' };
  }

  async updateName(userId: Types.ObjectId, name: string): Promise<PublicUser> {
    const user = await this.users.updateName(userId, name);
    if (!user) throw notFound('User not found');
    await RedisCache.delKeys([redisKeys.user(userId.toString())]);
    return UserMapper.toPublicUser(user);
  }
}
