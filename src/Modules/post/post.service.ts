import { type Types } from 'mongoose';
import { forbidden, notFound } from '../../utils/AppError.js';
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

  createPost(authorId: Types.ObjectId, authorName: string, input: CreatePostDto): Promise<PostDocument> {
    return this.posts.create({
      title: input.title,
      body: input.body,
      tags: input.tags,
      author: authorId,
      authorName,
      status: input.status,
    });
  }

  async getPublishedPost(id: Types.ObjectId): Promise<PostDocument> {
    const post = await this.posts.findById(id);
    if (!post || post.status !== 'published') throw notFound('Post not found');
    return post;
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
    return updated;
  }

  async deletePost(userId: Types.ObjectId, postId: Types.ObjectId): Promise<void> {
    await this.loadOwnedPost(postId, userId);
    await this.posts.deleteById(postId);
    await this.comments.deleteByPost(postId);
  }

  async listOwnPosts(userId: Types.ObjectId, page: number, limit: number): Promise<PublishedList> {
    return Paginator.paginate(page, limit, await this.posts.findByAuthor(userId, page, limit));
  }

  async listPublished(query: ListPostsQueryDto): Promise<PublishedList> {
    return Paginator.paginate(
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
  }
}
