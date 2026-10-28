import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const blankToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(blankToUndefined, schema);

const required = (name: string) =>
  z.preprocess(
    blankToUndefined,
    z.string({
      required_error: `${name} is required but missing`,
      invalid_type_error: `${name} is required but missing`,
    }).min(1, `${name} is required but missing`),
  );

export const configSchema = z.object({
  NODE_ENV: optional(z.enum(['development', 'test', 'production']).default('development')),
  PORT: optional(z.coerce.number().int().positive().default(3000)),
  MONGODB_URI: required('MONGODB_URI'),
  DB_NAME: optional(z.string().min(1).default('blog_app')),
  SESSION_TTL_DAYS: optional(z.coerce.number().int().positive().max(365).default(7)),
  LOGIN_MAX_ATTEMPTS: optional(z.coerce.number().int().positive().max(100).default(5)),
  LOGIN_WINDOW_MINUTES: optional(z.coerce.number().int().positive().max(1440).default(15)),
  BasicAuth: required('BasicAuth'),
  Password: required('Password'),
});

export type Env = z.infer<typeof configSchema>;

export const validateConfig = (source: Record<string, unknown>): Env => {
  const parsed = configSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join('\n'));
  }
  return parsed.data;
};

let cached: Env | undefined;

export const getEnv = (): Env => {
  if (!cached) cached = validateConfig(process.env);
  return cached;
};
