import { Router, type Request, type Response } from 'express';
import { authenticate, currentUser } from '../../middlewares/authenticate.js';
import { sendPaginated, sendSuccess, setCacheHeader } from '../../utils/response.js';
import { Paginator } from '../../utils/pagination.js';
import { PostService } from '../post/post.service.js';
import { updateMeDto } from './user.dto.js';
import { UserService } from './user.service.js';

export class UserController {
  public readonly router = Router();

  constructor(
    private readonly userService = new UserService(),
    private readonly postService = new PostService(),
  ) {
    this.router.use(authenticate);
    this.router.get('/me', this.getMe);
    this.router.patch('/me', this.updateMe);
    this.router.get('/me/posts', this.getMyPosts);
  }

  private getMe = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const { user, cache } = await this.userService.getProfile(userId);
    setCacheHeader(res, cache);
    sendSuccess(res, { user });
  };

  private updateMe = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const body = updateMeDto.parse(req.body);
    sendSuccess(res, { user: await this.userService.updateName(userId, body.name) });
  };

  private getMyPosts = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const { page, limit } = Paginator.parse(req.query);
    const { data, pagination } = await this.postService.listOwnPosts(userId, page, limit);
    sendPaginated(res, data, pagination);
  };
}

export default new UserController().router;
