import { randomBytes } from 'node:crypto';
import { type Types } from 'mongoose';
import { SESSION_TOKEN_BYTES } from '../../constants/index.js';
import { getEnv } from '../../config/env.js';
import { conflict, unauthorized } from '../../utils/AppError.js';
import { SessionRepository } from '../../Repository/session.repository.js';
import { UserRepository } from '../../Repository/user.repository.js';
import { UserMapper, type PublicUser } from '../user/user.mapper.js';
import type { LoginDto, SignupDto } from './auth.dto.js';
import { PasswordHasher } from './password.js';

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

  async login(input: LoginDto, userAgent: string): Promise<LoginResult> {
    const user = await this.users.findByEmailWithPassword(input.email);

    if (!user || !user.password || !(await PasswordHasher.verify(input.password, user.password))) {
      throw unauthorized('Invalid email or password');
    }

    const token = randomBytes(SESSION_TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + getEnv().SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.sessions.create({ userId: user._id, token, expiresAt, userAgent });

    return { token, expiresAt, user: UserMapper.toPublicUser(user) };
  }

  logout(token: string): Promise<boolean> {
    return this.sessions.deleteByToken(token);
  }

  logoutAll(userId: Types.ObjectId): Promise<number> {
    return this.sessions.deleteAllForUser(userId);
  }
}
