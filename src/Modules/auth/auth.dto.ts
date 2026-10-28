import { z } from 'zod';
import { USER_LIMITS } from '../../constants/index.js';
import { safeText } from '../../utils/validators.js';

const email = z
  .string({ required_error: 'email is required', invalid_type_error: 'email must be a string' })
  .trim()
  .email('email must be a valid email address')
  .transform((value) => value.toLowerCase());

const accountPassword = z
  .string({ required_error: 'password is required', invalid_type_error: 'password must be a string' })
  .min(USER_LIMITS.PASSWORD_MIN, `password must be at least ${USER_LIMITS.PASSWORD_MIN} characters`)
  .max(200, 'password must be at most 200 characters');

export const signupDto = z.strictObject({
  name: safeText('name').refine(
    (value) => value.length >= USER_LIMITS.NAME_MIN && value.length <= USER_LIMITS.NAME_MAX,
    `name must be ${USER_LIMITS.NAME_MIN} to ${USER_LIMITS.NAME_MAX} characters`,
  ),
  email,
  password: accountPassword,
});
export type SignupDto = z.infer<typeof signupDto>;

export const loginDto = z.strictObject({
  email,
  password: z.string({ required_error: 'password is required' }).min(1, 'password is required'),
});
export type LoginDto = z.infer<typeof loginDto>;
