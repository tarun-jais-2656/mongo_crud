import { Types } from 'mongoose';
import { badRequest } from './AppError.js';

export const parseObjectId = (value: unknown, label = 'id'): Types.ObjectId => {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw badRequest(`Invalid ${label}`);
  }
  return new Types.ObjectId(value);
};
