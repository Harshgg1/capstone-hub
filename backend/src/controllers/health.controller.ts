import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';

export class HealthController {
  public static checkHealth(_req: Request, res: Response, next: NextFunction): void {
    try {
      const health = HealthService.getHealth();
      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }
}
