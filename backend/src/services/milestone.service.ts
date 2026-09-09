import { MilestoneStatus, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateMilestoneDTO {
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  status?: MilestoneStatus;
}

export interface UpdateMilestoneDTO {
  title?: string;
  description?: string | null;
  dueDate?: string | Date | null;
  status?: MilestoneStatus;
}

export class MilestoneService {
  /**
   * Helper to verify if user has management permissions (FACULTY or project TEAM_LEAD)
   */
  private static canManageMilestones(
    user: { id: string; role: Role },
    project: {
      facultyId: string | null;
      teamId: string | null;
      team: {
        leadId: string | null;
        members: { userId: string; role: Role }[];
      } | null;
    }
  ): boolean {
    if (user.role === Role.FACULTY) {
      return true;
    }

    if (!project.team) {
      return false;
    }

    return (
      project.team.leadId === user.id ||
      project.team.members.some(
        (m) => m.userId === user.id && m.role === Role.TEAM_LEAD
      )
    );
  }

  /**
   * Create a milestone for a project
   */
  public static async createMilestone(
    projectId: string,
    data: CreateMilestoneDTO,
    user: { id: string; role: Role }
  ) {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId.trim() },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!this.canManageMilestones(user, project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const { title, description, dueDate, status } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError('Milestone title is required', 400);
    }

    let parsedDueDate: Date | null = null;
    if (dueDate !== undefined && dueDate !== null) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        throw new AppError('Invalid due date format', 400);
      }
      parsedDueDate = parsed;
    }

    let milestoneStatus: MilestoneStatus = MilestoneStatus.UPCOMING;
    if (status !== undefined) {
      if (!Object.values(MilestoneStatus).includes(status)) {
        throw new AppError(
          `Invalid milestone status. Allowed: ${Object.values(MilestoneStatus).join(', ')}`,
          400
        );
      }
      milestoneStatus = status;
    }

    return prisma.milestone.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        dueDate: parsedDueDate,
        status: milestoneStatus,
        projectId: project.id,
      },
    });
  }

  /**
   * Get all milestones for a project
   */
  public static async getMilestonesByProjectId(
    projectId: string,
    _user: { id: string; role: Role }
  ) {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId.trim() },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return prisma.milestone.findMany({
      where: { projectId: project.id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Get a milestone by ID
   */
  public static async getMilestoneById(
    milestoneId: string,
    _user: { id: string; role: Role }
  ) {
    if (!milestoneId || typeof milestoneId !== 'string' || !milestoneId.trim()) {
      throw new AppError('Milestone ID is required', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId.trim() },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    return milestone;
  }

  /**
   * Update a milestone by ID
   */
  public static async updateMilestone(
    milestoneId: string,
    data: UpdateMilestoneDTO,
    user: { id: string; role: Role }
  ) {
    if (!milestoneId || typeof milestoneId !== 'string' || !milestoneId.trim()) {
      throw new AppError('Milestone ID is required', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId.trim() },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (!this.canManageMilestones(user, milestone.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const updateData: {
      title?: string;
      description?: string | null;
      dueDate?: Date | null;
      status?: MilestoneStatus;
    } = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new AppError('Milestone title cannot be empty', 400);
      }
      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate === null) {
        updateData.dueDate = null;
      } else {
        const parsed = new Date(data.dueDate);
        if (isNaN(parsed.getTime())) {
          throw new AppError('Invalid due date format', 400);
        }
        updateData.dueDate = parsed;
      }
    }

    if (data.status !== undefined) {
      if (!Object.values(MilestoneStatus).includes(data.status)) {
        throw new AppError(
          `Invalid milestone status. Allowed: ${Object.values(MilestoneStatus).join(', ')}`,
          400
        );
      }
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('At least one field must be provided to update', 400);
    }

    return prisma.milestone.update({
      where: { id: milestone.id },
      data: updateData,
    });
  }

  /**
   * Delete a milestone by ID
   */
  public static async deleteMilestone(
    milestoneId: string,
    user: { id: string; role: Role }
  ) {
    if (!milestoneId || typeof milestoneId !== 'string' || !milestoneId.trim()) {
      throw new AppError('Milestone ID is required', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId.trim() },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (!this.canManageMilestones(user, milestone.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    await prisma.milestone.delete({
      where: { id: milestone.id },
    });

    return { message: 'Milestone deleted successfully' };
  }
}
