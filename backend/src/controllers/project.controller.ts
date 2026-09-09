import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  public static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, teamId } = req.body;

      if (!name) {
        res.status(400).json({ success: false, error: 'Project name is required' });
        return;
      }

      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const project = await ProjectService.createProject({ name, description, teamId }, req.user);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await ProjectService.getProjects();
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const project = await ProjectService.getProjectById(id);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Project not found') {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}
