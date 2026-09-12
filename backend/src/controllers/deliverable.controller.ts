import { Request, Response, NextFunction } from 'express';
import { DeliverableService, ReviewDeliverableDTO, ReviewAction } from '../services/deliverable.service';
import { AppError } from '../middleware/errorHandler';

export class DeliverableController {
  /**
   * POST /api/milestones/:milestoneId/deliverables
   */
  public static async createDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const milestoneId = req.params.milestoneId || req.body.milestoneId;
      const deliverable = await DeliverableService.createDeliverable(
        milestoneId,
        req.body,
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'Deliverable created successfully',
        data: deliverable,
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
   * GET /api/milestones/:milestoneId/deliverables
   */
  public static async getDeliverablesByMilestone(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { milestoneId } = req.params;
      const deliverables = await DeliverableService.getDeliverablesByMilestone(
        milestoneId,
        req.user
      );
      res.status(200).json({
        success: true,
        data: deliverables,
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
   * GET /api/projects/:projectId/deliverables
   */
  public static async getDeliverablesByProject(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { projectId } = req.params;
      const deliverables = await DeliverableService.getDeliverablesByProject(
        projectId,
        req.user
      );
      res.status(200).json({
        success: true,
        data: deliverables,
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
   * GET /api/deliverables/:id
   */
  public static async getDeliverableById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const deliverable = await DeliverableService.getDeliverableById(id, req.user);
      res.status(200).json({
        success: true,
        data: deliverable,
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
   * POST /api/deliverables/:id/submit
   * Submit a deliverable for faculty review (DRAFT or REVISION_REQUESTED → SUBMITTED).
   */
  public static async submitDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const deliverable = await DeliverableService.submitDeliverable(id, req.user);
      res.status(200).json({
        success: true,
        message: 'Deliverable submitted for review successfully',
        data: deliverable,
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
   * POST /api/deliverables/:id/review
   * Faculty-only review action: START_REVIEW | APPROVE | REQUEST_REVISION
   */
  public static async reviewDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const body = req.body as ReviewDeliverableDTO;

      if (!body.action || !Object.values(ReviewAction).includes(body.action)) {
        res.status(400).json({
          success: false,
          error: `Invalid or missing review action. Allowed: ${Object.values(ReviewAction).join(', ')}`,
        });
        return;
      }

      const deliverable = await DeliverableService.reviewDeliverable(id, body, req.user);

      const messages: Record<ReviewAction, string> = {
        [ReviewAction.START_REVIEW]: 'Review started — deliverable is now under review',
        [ReviewAction.APPROVE]: 'Deliverable approved successfully',
        [ReviewAction.REQUEST_REVISION]: 'Revision requested — deliverable returned to team',
      };

      res.status(200).json({
        success: true,
        message: messages[body.action],
        data: deliverable,
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
   * PUT/PATCH /api/deliverables/:id
   */
  public static async updateDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const deliverable = await DeliverableService.updateDeliverable(id, req.body, req.user);
      res.status(200).json({
        success: true,
        message: 'Deliverable updated successfully',
        data: deliverable,
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
   * DELETE /api/deliverables/:id
   */
  public static async deleteDeliverable(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const result = await DeliverableService.deleteDeliverable(id, req.user);
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
