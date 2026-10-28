import { Router, type Request, type Response } from 'express';

export class HealthController {
  public readonly router = Router();

  constructor() {
    this.router.get('/', this.check);
  }

  private check = (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok', statusCode: 200 });
  };
}

export default new HealthController().router;
