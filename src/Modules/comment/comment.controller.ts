import { Router, type Request, type Response } from 'express';
import { authenticate, currentUser } from '../../middlewares/authenticate.js';
import { parseObjectId } from '../../utils/objectId.js';
import { sendSuccess } from '../../utils/response.js';
import { CommentService } from './comment.service.js';

export class CommentController {
  public readonly router = Router();

  constructor(private readonly commentService = new CommentService()) {
    this.router.delete('/:id', authenticate, this.remove);
  }

  private remove = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const id = parseObjectId(req.params.id);
    await this.commentService.deleteComment(userId, id);
    sendSuccess(res, null, 204);
  };
}

export default new CommentController().router;
