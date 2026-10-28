import { Router, type Request, type Response } from 'express';
import { basicAuth } from '../../middlewares/basicAuth.js';
import { sendSuccess } from '../../utils/response.js';
import { authenticate, currentUser } from '../../middlewares/authenticate.js';
import { loginDto, signupDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';

export class AuthController {
  public readonly router = Router();

  constructor(private readonly authService = new AuthService()) {
    this.router.post('/signup', basicAuth, this.signup);
    this.router.post('/login', basicAuth, this.login);
    this.router.post('/logout', authenticate, this.logout);
    this.router.post('/logout-all', authenticate, this.logoutAll);
  }

  private signup = async (req: Request, res: Response): Promise<void> => {
    const body = signupDto.parse(req.body);
    const user = await this.authService.signup(body);
    sendSuccess(res, { user }, 201);
  };

  private login = async (req: Request, res: Response): Promise<void> => {
    const body = loginDto.parse(req.body);
    const { token, expiresAt, user } = await this.authService.login(
      body,
      req.get('user-agent') ?? '',
      req.ip ?? 'unknown',
    );
    sendSuccess(res, { user, token, expiresAt });
  };

  private logout = async (req: Request, res: Response): Promise<void> => {
    const { userId, token } = currentUser(req);
    await this.authService.logout(userId.toString(), token);
    sendSuccess(res, { message: 'Logged out' });
  };

  private logoutAll = async (req: Request, res: Response): Promise<void> => {
    const { userId } = currentUser(req);
    const count = await this.authService.logoutAll(userId);
    sendSuccess(res, { message: 'Logged out from all devices', sessionsRemoved: count });
  };
}

export default new AuthController().router;
