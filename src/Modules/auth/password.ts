import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../../constants/index.js';

export class PasswordHasher {
  static hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  static verify(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
