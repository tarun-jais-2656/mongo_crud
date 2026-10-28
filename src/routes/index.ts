import { Router } from 'express';
import authController from '../Modules/auth/auth.controller.js';
import commentController from '../Modules/comment/comment.controller.js';
import healthController from '../Modules/health/health.controller.js';
import postController from '../Modules/post/post.controller.js';
import statsController from '../Modules/stats/stats.controller.js';
import userController from '../Modules/user/user.controller.js';

const router = Router();

router.use('/health', healthController);
router.use('/auth', authController);
router.use('/users', userController);
router.use('/posts', postController);
router.use('/comments', commentController);
router.use('/stats', statsController);

export default router;
