import { type HydratedDocument, type Types } from 'mongoose';
import { UserModel, type IUser } from '../model/user.model.js';

export interface NewUser {
  name: string;
  email: string;
  password: string; // already hashed
}

export type UserDocument = HydratedDocument<IUser>;

export class UserRepository {
  create(input: NewUser): Promise<UserDocument> {
    return UserModel.create(input);
  }

  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).select('+password').exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await UserModel.exists({ email })) !== null;
  }

  findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return UserModel.findById(id).exec();
  }

  updateName(id: Types.ObjectId, name: string): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { name }, { new: true, runValidators: true }).exec();
  }
}
