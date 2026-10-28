import type { UserDocument } from '../../Repository/user.repository.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toPublicUser(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
