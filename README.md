# Blog API

REST API for a blog. Users, posts, comments, and sessions live in MongoDB. Redis is a fast copy of data that is expensive or frequent to read. It does not change any endpoint, request, or response body.

## Redis

Start Redis locally (`redis://localhost:6379`) and set `REDIS_URL` in `.env`. The process logs `Redis connected` and only then accepts HTTP traffic. If a Redis command fails later, the error is logged and the request continues against MongoDB.

`GET /api/users/me`, `GET /api/posts`, `GET /api/posts/:id`, `GET /api/stats`, and the first page of `GET /api/posts/:id/comments` send `X-Cache: HIT` or `X-Cache: MISS`. That header is the only difference between a cached response and a database response.

Statistics are cached for 5 minutes. A count of posts or a top-tags list does not need to be exact to the second, and the aggregation is the heaviest read in the API. Serving a copy that is at most 5 minutes old keeps that query from running on every request.

Every key starts with `blog_<yourname>:` (the `DB_NAME` value). The names below omit that prefix.

### Redis keys

| Key | Type | TTL | Set when | Deleted when |
| --- | --- | --- | --- | --- |
| `session:<token>` | String (userId) | until `expiresAt` | login, or a valid session is loaded from MongoDB | logout, logout-all |
| `user:<userId>:sessions` | Set of tokens | until the newest session `expiresAt` | login | logout-all (token removed on logout) |
| `user:<userId>` | String (JSON profile, no password) | 1 hour | `GET /api/users/me` cache miss | `PATCH /api/users/me` |
| `post:<id>` | String (JSON published post) | 10 minutes | `GET /api/posts/:id` cache miss | post update, post delete, comment added or deleted |
| `posts:list:version` | String counter | none | incremented when any post is created, updated, deleted, or its `commentCount` changes | never (old list keys expire on their own) |
| `posts:list:v<version>:p<page>:l<limit>:s<search>:t<tag>:o<sort>` | String (JSON list) | 60 seconds | `GET /api/posts` cache miss | expires; ignored after the version increments |
| `stats` | String (JSON aggregation) | 5 minutes | `GET /api/stats` cache miss | expires |
| `login:fail:<email>` | String counter | 15 minutes | failed login | successful login, or expiry |
| `login:fail:ip:<ip>` | String counter | 15 minutes | failed login | successful login, or expiry |
| `post:<id>:comments:version` | String counter | none | incremented when a comment on that post is added or deleted | never |
| `post:<id>:comments:v<version>:p1:l<limit>` | String (JSON first page) | 60 seconds | first page of `GET /api/posts/:id/comments` | expires; ignored after the version increments |
