import { Router, type Request, type Response } from 'express';
import { authenticate, currentUser } from '../../middlewares/authenticate.js';
import { parseObjectId } from '../../utils/objectId.js';
import { sendPaginated, sendSuccess, setCacheHeader } from '../../utils/response.js';
import { commentListQueryDto, createCommentDto } from '../comment/comment.dto.js';
import { CommentService } from '../comment/comment.service.js';
import { createPostDto, listPostsQueryDto, updatePostDto } from './post.dto.js';
import { PostService } from './post.service.js';

export class PostController {
  public readonly router = Router();

  constructor(
    private readonly postService = new PostService(),
    private readonly commentService = new CommentService(),
  ) {
    this.router.get('/', authenticate, this.list);
    this.router.post('/', authenticate, this.create);
    this.router.get('/:id', authenticate, this.getOne);
    this.router.patch('/:id', authenticate, this.update);
    this.router.delete('/:id', authenticate, this.remove);

    this.router.post('/:id/comments', authenticate, this.addComment);
    this.router.get('/:id/comments', authenticate, this.listComments);
  }

  private list = async (req: Request, res: Response): Promise<void> => {
    const query = listPostsQueryDto.parse(req.query);
    const { data, pagination, cache } = await this.postService.listPublished(query);
    setCacheHeader(res, cache);
    sendPaginated(res, data, pagination);
  };

  private create = async (req: Request, res: Response): Promise<void> => {
    const { userId, name } = currentUser(req);
    const body = createPostDto.parse(req.body);
    const post = await this.postService.createPost(userId, name, body);
    sendSuccess(res, { post }, 201);
  };

  private getOne = async (req: Request, res: Response): Promise<void> => {
    const id = parseObjectId(req.params.id);
    const { post, cache } = await this.postService.getPublishedPost(id);
    setCacheHeader(res, cache);
    sendSuccess(res, { post });
  };

  private update = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const id = parseObjectId(req.params.id);
    const body = updatePostDto.parse(req.body);
    sendSuccess(res, { post: await this.postService.updatePost(userId, id, body) });
  };

  private remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const id = parseObjectId(req.params.id);
    await this.postService.deletePost(userId, id);
    sendSuccess(res, null, 204);
  };

  private addComment = async (req: Request, res: Response): Promise<void> => {
    const { userId, name } = currentUser(req);
    const postId = parseObjectId(req.params.id);
    const body = createCommentDto.parse(req.body);
    const comment = await this.commentService.addComment(postId, userId, name, body);
    sendSuccess(res, { comment }, 201);
  };

  private listComments = async (req: Request, res: Response): Promise<void> => {
    const postId = parseObjectId(req.params.id);
    const query = commentListQueryDto.parse(req.query);
    const result = await this.commentService.listComments(postId, query);

    // Cursor mode (bonus) returns a different envelope than offset mode.
    if ('nextCursor' in result) {
      sendSuccess(res, { data: result.data, nextCursor: result.nextCursor });
      return;
    }
    setCacheHeader(res, result.cache);
    sendPaginated(res, result.data, result.pagination);
  };
}

export default new PostController().router;
