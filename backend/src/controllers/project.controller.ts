import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AppError } from '../middleware/errorHandler';

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
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const projects = await ProjectService.getProjects(req.user);
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
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const project = await ProjectService.getProjectById(id, req.user);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const project = await ProjectService.updateProject(id, req.body, req.user);

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Add a team member to a project's team.
   * Expects JSON body: { userId?: string, email?: string, role?: Role }
   */
  public static async addTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const { userId, email, role } = req.body;
      const member = await ProjectService.addTeamMember(projectId, { userId, email, role }, req.user);
      res.status(201).json({ success: true, data: member });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Remove a team member from a project's team.
   * URL param `userId` identifies the member to remove.
   */
  public static async removeTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId, userId: memberUserId } = req.params;
      const result = await ProjectService.removeTeamMember(projectId, memberUserId, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get team members of a project with optional pagination.
   * Query params: page, pageSize
   */
  public static async getTeamMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const page = req.query.page ? Number(req.query.page) : undefined;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
      const result = await ProjectService.getTeamMembers(projectId, { page, pageSize }, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Update the role of a team member in a project's team.
   * Expects JSON body: { role: Role }
   */
  public static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId, userId: memberUserId } = req.params;
      const { role } = req.body;
      const updatedMember = await ProjectService.updateMemberRole(
        projectId,
        memberUserId,
        { role },
        req.user
      );
      res.status(200).json({
        success: true,
        message: 'Member role updated successfully',
        data: updatedMember,
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async getProjectBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id } = req.params;
      const board = await ProjectService.getProjectBoard(id, req.user);
      res.status(200).json({ success: true, data: board });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async inviteTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const { userId, email, role } = req.body;
      const invitation = await ProjectService.inviteTeamMember(projectId, { userId, email, role }, req.user);
      res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async getProjectInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const invitations = await ProjectService.getProjectInvitations(projectId, req.user);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async cancelProjectInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId, invitationId } = req.params;
      const result = await ProjectService.cancelProjectInvitation(projectId, invitationId, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async inviteFacultyAdvisor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const { userId, email, facultyId } = req.body;
      const invitation = await ProjectService.inviteFacultyAdvisor(projectId, { userId, email, facultyId }, req.user);
      res.status(201).json({ success: true, data: invitation });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async getFacultyInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId } = req.params;
      const invitations = await ProjectService.getFacultyInvitations(projectId, req.user);
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }

  public static async cancelFacultyInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const { id: projectId, invitationId } = req.params;
      const result = await ProjectService.cancelFacultyInvitation(projectId, invitationId, req.user);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ success: false, error: error.message });
        return;
      }
      next(error);
    }
  }
}
