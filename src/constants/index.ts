export const BCRYPT_ROUNDS = 12;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const SESSION_TOKEN_BYTES = 48;

export const POST_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 120,
  BODY_MIN: 20,
  MAX_TAGS: 5,
} as const;

export const USER_LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  PASSWORD_MIN: 8,
} as const;

export const COMMENT_LIMITS = {
  TEXT_MIN: 1,
  TEXT_MAX: 500,
} as const;

export const POST_STATUS = ['draft', 'published'] as const;
export type PostStatus = (typeof POST_STATUS)[number];

export const POST_SORTS = ['newest', 'oldest', 'mostCommented'] as const;
export type PostSort = (typeof POST_SORTS)[number];

/** Redis TTLs in seconds. posts:list:version is the only key without a TTL. */
export const REDIS_TTL = {
  PROFILE: 60 * 60,
  POST: 10 * 60,
  POST_LIST: 60,
  STATS: 5 * 60,
  COMMENTS: 60,
  LOGIN_WINDOW: 15 * 60,
} as const;

export const LOGIN_MAX_FAILURES = 5;
