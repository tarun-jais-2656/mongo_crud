import { Router, type Request, type Response } from 'express';
import { basicAuth } from '../../middlewares/basicAuth.js';
import { sendSuccess } from '../../utils/response.js';
import { StatsService } from './stats.service.js';

export class StatsController {
  public readonly router = Router();

  constructor(private readonly statsService = new StatsService()) {
    this.router.get('/', basicAuth, this.getStats);
  }

  private getStats = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.statsService.getStats());
  };
}

export default new StatsController().router;
