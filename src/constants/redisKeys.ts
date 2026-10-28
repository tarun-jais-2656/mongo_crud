/**
 * Redis key names WITHOUT the blog_<name>: prefix.
 * The prefix is applied in one place, RedisCache.key().
 */
export const redisKeys = {
  session: (token: string): string => `session:${token}`,
  userSessions: (userId: string): string => `user:${userId}:sessions`,
  user: (userId: string): string => `user:${userId}`,
  post: (id: string): string => `post:${id}`,
  postListVersion: (): string => 'posts:list:version',
  postList: (version: number, page: number, limit: number, search: string, tag: string, sort: string): string =>
    `posts:list:v${version}:p${page}:l${limit}:s${search}:t${tag}:o${sort}`,
  stats: (): string => 'stats',
  loginFailEmail: (email: string): string => `login:fail:${email}`,
  loginFailIp: (ip: string): string => `login:fail:ip:${ip}`,
  commentVersion: (postId: string): string => `post:${postId}:comments:version`,
  commentList: (postId: string, version: number, page: number, limit: number): string =>
    `post:${postId}:comments:v${version}:p${page}:l${limit}`,
};
