import { RequirementPriority, RequirementStatus, RequirementType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateRequirementDTO {
  title: string;
  description: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
}

export interface UpdateRequirementDTO {
  title?: string;
  description?: string;
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
}

export interface RequirementQueryDTO {
  type?: RequirementType;
  priority?: RequirementPriority;
  status?: RequirementStatus;
}

/**
 * Valid state transitions for requirement status workflow
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  [RequirementStatus.DRAFT]: [
    RequirementStatus.DRAFT,
    RequirementStatus.IN_REVIEW,
  ],
  [RequirementStatus.IN_REVIEW]: [
    RequirementStatus.IN_REVIEW,
    RequirementStatus.APPROVED,
    RequirementStatus.REJECTED,
    RequirementStatus.DRAFT,
  ],
  [RequirementStatus.APPROVED]: [
    RequirementStatus.APPROVED,
    RequirementStatus.COMPLETED,
    RequirementStatus.IN_REVIEW,
    RequirementStatus.DRAFT,
  ],
  [RequirementStatus.REJECTED]: [
    RequirementStatus.REJECTED,
    RequirementStatus.COMPLETED,
  ],
  [RequirementStatus.COMPLETED]: [
    RequirementStatus.COMPLETED,
    RequirementStatus.APPROVED,
    RequirementStatus.IN_REVIEW,
  ],
};

export class RequirementService {
  /**
   * Helper to verify if a user has access to a project and its requirements.
   * Access is granted to FACULTY users, the assigned faculty advisor, and members/lead of the project team.
   */
  private static canAccessProject(
    user: { id: string; role: Role },
    project: {
      id: string;
      facultyId: string | null;
      teamId: string | null;
      team: {
        leadId: string | null;
        members: { userId: string; role: Role }[];
      } | null;
    }
  ): boolean {
    if (user.role === Role.FACULTY || project.facultyId === user.id) {
      return true;
    }

    if (!project.team) {
      return false;
    }

    return (
      project.team.leadId === user.id ||
      project.team.members.some((m) => m.userId === user.id)
    );
  }

  /**
   * Create a requirement for a project with optional priority and status.
   */
  public static async createRequirement(
    projectId: string,
    data: CreateRequirementDTO,
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

    if (!this.canAccessProject(user, project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const { title, description, type, priority, status } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError('Requirement title is required', 400);
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new AppError('Requirement description is required', 400);
    }

    let requirementType: RequirementType = RequirementType.FUNCTIONAL;
    if (type !== undefined) {
      if (!Object.values(RequirementType).includes(type)) {
        throw new AppError(
          `Invalid requirement type. Allowed: ${Object.values(RequirementType).join(', ')}`,
          400
        );
      }
      requirementType = type;
    }

    let requirementPriority: RequirementPriority = RequirementPriority.MEDIUM;
    if (priority !== undefined) {
      if (!Object.values(RequirementPriority).includes(priority)) {
        throw new AppError(
          `Invalid requirement priority. Allowed: ${Object.values(RequirementPriority).join(', ')}`,
          400
        );
      }
      requirementPriority = priority;
    }

    let requirementStatus: RequirementStatus = RequirementStatus.DRAFT;
    if (status !== undefined) {
      if (!Object.values(RequirementStatus).includes(status)) {
        throw new AppError(
          `Invalid requirement status. Allowed: ${Object.values(RequirementStatus).join(', ')}`,
          400
        );
      }
      requirementStatus = status;
    }

    return prisma.requirement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type: requirementType,
        priority: requirementPriority,
        status: requirementStatus,
        projectId: project.id,
      },
    });
  }

  /**
   * Get all requirements for a project with optional type, priority, and status filtering.
   */
  public static async getRequirementsByProjectId(
    projectId: string,
    query?: RequirementQueryDTO,
    user?: { id: string; role: Role }
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

    if (user && !this.canAccessProject(user, project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const where: {
      projectId: string;
      type?: RequirementType;
      priority?: RequirementPriority;
      status?: RequirementStatus;
    } = {
      projectId: project.id,
    };

    if (query?.type) {
      if (!Object.values(RequirementType).includes(query.type)) {
        throw new AppError(
          `Invalid requirement type. Allowed: ${Object.values(RequirementType).join(', ')}`,
          400
        );
      }
      where.type = query.type;
    }

    if (query?.priority) {
      if (!Object.values(RequirementPriority).includes(query.priority)) {
        throw new AppError(
          `Invalid requirement priority. Allowed: ${Object.values(RequirementPriority).join(', ')}`,
          400
        );
      }
      where.priority = query.priority;
    }

    if (query?.status) {
      if (!Object.values(RequirementStatus).includes(query.status)) {
        throw new AppError(
          `Invalid requirement status. Allowed: ${Object.values(RequirementStatus).join(', ')}`,
          400
        );
      }
      where.status = query.status;
    }

    return prisma.requirement.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a requirement by ID.
   */
  public static async getRequirementById(
    requirementId: string,
    user?: { id: string; role: Role }
  ) {
    if (!requirementId || typeof requirementId !== 'string' || !requirementId.trim()) {
      throw new AppError('Requirement ID is required', 400);
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId.trim() },
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

    if (!requirement) {
      throw new AppError('Requirement not found', 404);
    }

    if (user && !this.canAccessProject(user, requirement.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    return requirement;
  }

  /**
   * Update a requirement by ID with priority and status workflow validation.
   */
  public static async updateRequirement(
    requirementId: string,
    data: UpdateRequirementDTO,
    user: { id: string; role: Role }
  ) {
    if (!requirementId || typeof requirementId !== 'string' || !requirementId.trim()) {
      throw new AppError('Requirement ID is required', 400);
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId.trim() },
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

    if (!requirement) {
      throw new AppError('Requirement not found', 404);
    }

    if (!this.canAccessProject(user, requirement.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const updateData: {
      title?: string;
      description?: string;
      type?: RequirementType;
      priority?: RequirementPriority;
      status?: RequirementStatus;
    } = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new AppError('Requirement title cannot be empty', 400);
      }
      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      if (typeof data.description !== 'string' || !data.description.trim()) {
        throw new AppError('Requirement description cannot be empty', 400);
      }
      updateData.description = data.description.trim();
    }

    if (data.type !== undefined) {
      if (!Object.values(RequirementType).includes(data.type)) {
        throw new AppError(
          `Invalid requirement type. Allowed: ${Object.values(RequirementType).join(', ')}`,
          400
        );
      }
      updateData.type = data.type;
    }

    if (data.priority !== undefined) {
      if (!Object.values(RequirementPriority).includes(data.priority)) {
        throw new AppError(
          `Invalid requirement priority. Allowed: ${Object.values(RequirementPriority).join(', ')}`,
          400
        );
      }
      updateData.priority = data.priority;
    }

    if (data.status !== undefined) {
      if (!Object.values(RequirementStatus).includes(data.status)) {
        throw new AppError(
          `Invalid requirement status. Allowed: ${Object.values(RequirementStatus).join(', ')}`,
          400
        );
      }

      // Enforce status workflow transitions
      const currentStatus = requirement.status;
      const newStatus = data.status;
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];

      if (!allowedNext.includes(newStatus)) {
        throw new AppError(
          `Invalid status transition from ${currentStatus} to ${newStatus}`,
          400
        );
      }

      updateData.status = newStatus;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('At least one field must be provided to update', 400);
    }

    return prisma.requirement.update({
      where: { id: requirement.id },
      data: updateData,
    });
  }

  /**
   * Delete a requirement by ID.
   */
  public static async deleteRequirement(
    requirementId: string,
    user: { id: string; role: Role }
  ) {
    if (!requirementId || typeof requirementId !== 'string' || !requirementId.trim()) {
      throw new AppError('Requirement ID is required', 400);
    }

    const requirement = await prisma.requirement.findUnique({
      where: { id: requirementId.trim() },
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

    if (!requirement) {
      throw new AppError('Requirement not found', 404);
    }

    if (!this.canAccessProject(user, requirement.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    await prisma.requirement.delete({
      where: { id: requirement.id },
    });

    return { message: 'Requirement deleted successfully' };
  }
}
