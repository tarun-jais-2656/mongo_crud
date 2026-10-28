import { randomBytes } from 'node:crypto';
import { type Types } from 'mongoose';
import { SESSION_TOKEN_BYTES } from '../../constants/index.js';
import { redisKeys } from '../../constants/redisKeys.js';
import { getEnv } from '../../config/env.js';
import { conflict, unauthorized } from '../../utils/AppError.js';
import { RedisCache } from '../../utils/cache.js';
import { loginThrottle } from '../../middlewares/loginRateLimit.js';
import { SessionRepository } from '../../Repository/session.repository.js';
import { UserRepository } from '../../Repository/user.repository.js';
import { UserMapper, type PublicUser } from '../user/user.mapper.js';
import type { LoginDto, SignupDto } from './auth.dto.js';
import { PasswordHasher } from './password.js';

const secondsUntil = (date: Date): number => Math.floor((date.getTime() - Date.now()) / 1000);

export interface LoginResult {
  token: string;
  expiresAt: Date;
  user: PublicUser;
}

export class AuthService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly sessions = new SessionRepository(),
  ) {}

  async signup(input: SignupDto): Promise<PublicUser> {
    if (await this.users.existsByEmail(input.email)) {
      throw conflict('A user with that email already exists');
    }
    const user = await this.users.create({
      name: input.name,
      email: input.email,
      password: await PasswordHasher.hash(input.password),
    });
    return UserMapper.toPublicUser(user);
  }

  async login(input: LoginDto, userAgent: string, ip: string): Promise<LoginResult> {
    await loginThrottle.assertAllowed(input.email, ip);

    const user = await this.users.findByEmailWithPassword(input.email);

    if (!user || !user.password || !(await PasswordHasher.verify(input.password, user.password))) {
      await loginThrottle.recordFailure(input.email, ip);
      throw unauthorized('Invalid email or password');
    }

    await loginThrottle.clear(input.email, ip);

    const token = randomBytes(SESSION_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + getEnv().SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.sessions.create({ userId: user._id, token, expiresAt, userAgent });
    await this.rememberSession(token, user._id.toString(), expiresAt);

    return { token, expiresAt, user: UserMapper.toPublicUser(user) };
  }

  async logout(userId: string, token: string): Promise<boolean> {
    const deleted = await this.sessions.deleteByToken(token);
    await RedisCache.delKeys([redisKeys.session(token)]);
    await RedisCache.srem(redisKeys.userSessions(userId), token);
    return deleted;
  }

  async logoutAll(userId: Types.ObjectId): Promise<number> {
    const id = userId.toString();
    const tokens = await RedisCache.smembers(redisKeys.userSessions(id));
    const removed = await this.sessions.deleteAllForUser(userId);
    await RedisCache.delKeys([redisKeys.userSessions(id), ...tokens.map((token) => redisKeys.session(token))]);
    return removed;
  }

  private async rememberSession(token: string, userId: string, expiresAt: Date): Promise<void> {
    const ttl = secondsUntil(expiresAt);
    await RedisCache.set(redisKeys.session(token), userId, ttl);
    await RedisCache.sadd(redisKeys.userSessions(userId), token, ttl);
  }
}
