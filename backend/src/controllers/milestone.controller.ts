import { Request, Response, NextFunction } from 'express';
import { MilestoneService } from '../services/milestone.service';
import { AppError } from '../middleware/errorHandler';

export class MilestoneController {
  /**
   * Create a milestone for a project.
   */
  public static async createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const projectId = req.params.projectId || req.body.projectId;
      const milestone = await MilestoneService.createMilestone(projectId, req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data: milestone,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get all milestones for a project.
   */
  public static async getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { projectId } = req.params;
      const milestones = await MilestoneService.getMilestonesByProjectId(projectId, req.user);
      res.status(200).json({
        success: true,
        data: milestones,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get milestone by ID.
   */
  public static async getMilestoneById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const milestone = await MilestoneService.getMilestoneById(id, req.user);
      res.status(200).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Update milestone by ID.
   */
  public static async updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const milestone = await MilestoneService.updateMilestone(id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: 'Milestone updated successfully',
        data: milestone,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Delete milestone by ID.
   */
  public static async deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const result = await MilestoneService.deleteMilestone(id, req.user);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}
