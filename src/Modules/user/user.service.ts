import { type Types } from 'mongoose';
import { notFound } from '../../utils/AppError.js';
import { UserRepository } from '../../Repository/user.repository.js';
import { UserMapper, type PublicUser } from './user.mapper.js';

export class UserService {
  constructor(private readonly users = new UserRepository()) {}

  async getProfile(userId: Types.ObjectId): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw notFound('User not found');
    return UserMapper.toPublicUser(user);
  }

  async updateName(userId: Types.ObjectId, name: string): Promise<PublicUser> {
    const user = await this.users.updateName(userId, name);
    if (!user) throw notFound('User not found');
    return UserMapper.toPublicUser(user);
  }
}
