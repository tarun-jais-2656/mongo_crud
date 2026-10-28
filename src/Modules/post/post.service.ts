import { type Types } from 'mongoose';
import { REDIS_TTL } from '../../constants/index.js';
import { redisKeys } from '../../constants/redisKeys.js';
import { forbidden, notFound } from '../../utils/AppError.js';
import { RedisCache, type CacheState } from '../../utils/cache.js';
import { CacheInvalidation } from '../../utils/cacheInvalidation.js';
import { Paginator, type Paginated } from '../../utils/pagination.js';
import { CommentRepository } from '../../Repository/comment.repository.js';
import { PostRepository, type PostDocument } from '../../Repository/post.repository.js';
import type { CreatePostDto, ListPostsQueryDto, UpdatePostDto } from './post.dto.js';

export type PublishedList = Paginated;

export class PostService {
  constructor(
    private readonly posts = new PostRepository(),
    private readonly comments = new CommentRepository(),
  ) {}

  async createPost(authorId: Types.ObjectId, authorName: string, input: CreatePostDto): Promise<PostDocument> {
    const post = await this.posts.create({
      title: input.title,
      body: input.body,
      tags: input.tags,
      author: authorId,
      authorName,
      status: input.status,
    });
    await CacheInvalidation.listChanged();
    return post;
  }

  async getPublishedPost(id: Types.ObjectId): Promise<{ post: unknown; cache: CacheState }> {
    const key = redisKeys.post(id.toString());
    const cached = await RedisCache.getJSON<Record<string, unknown>>(key);
    if (cached && cached.status === 'published') return { post: cached, cache: 'HIT' };

    const post = await this.posts.findById(id);
    if (!post || post.status !== 'published') throw notFound('Post not found');
    const plain = post.toJSON();
    await RedisCache.setJSON(key, plain, REDIS_TTL.POST);
    return { post: plain, cache: 'MISS' };
  }

  private async loadOwnedPost(postId: Types.ObjectId, userId: Types.ObjectId): Promise<PostDocument> {
    const post = await this.posts.findById(postId);
    if (!post) throw notFound('Post not found');
    if (!post.author.equals(userId)) throw forbidden('You can only modify your own posts');
    return post;
  }

  async updatePost(
    userId: Types.ObjectId,
    postId: Types.ObjectId,
    input: UpdatePostDto,
  ): Promise<PostDocument> {
    await this.loadOwnedPost(postId, userId);
    const updated = await this.posts.updateById(postId, input);
    if (!updated) throw notFound('Post not found');
    await CacheInvalidation.postChanged(postId.toString());
    return updated;
  }

  async deletePost(userId: Types.ObjectId, postId: Types.ObjectId): Promise<void> {
    await this.loadOwnedPost(postId, userId);
    await this.posts.deleteById(postId);
    await this.comments.deleteByPost(postId);
    await CacheInvalidation.postChanged(postId.toString());
  }

  async listOwnPosts(userId: Types.ObjectId, page: number, limit: number): Promise<PublishedList> {
    return Paginator.paginate(page, limit, await this.posts.findByAuthor(userId, page, limit));
  }

  async listPublished(query: ListPostsQueryDto): Promise<PublishedList & { cache: CacheState }> {
    const search = (query.search ?? '').toLowerCase();
    const tag = (query.tag ?? '').toLowerCase();
    const version = Number((await RedisCache.get(redisKeys.postListVersion())) ?? '0') || 0;
    const key = redisKeys.postList(version, query.page, query.limit, search, tag, query.sort);
    const cached = await RedisCache.getJSON<PublishedList>(key);
    if (cached) return { ...cached, cache: 'HIT' };

    const list = Paginator.paginate(
      query.page,
      query.limit,
      await this.posts.listPublished({
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        ...(query.search ? { search: query.search } : {}),
        ...(query.tag ? { tag: query.tag } : {}),
      }),
    );
    await RedisCache.setJSON(key, list, REDIS_TTL.POST_LIST);
    return { ...list, cache: 'MISS' };
  }
}
