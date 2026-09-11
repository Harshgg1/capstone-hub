import { RequirementType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateRequirementDTO {
  title: string;
  description: string;
  type?: RequirementType;
}

export interface UpdateRequirementDTO {
  title?: string;
  description?: string;
  type?: RequirementType;
}

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
   * Create a requirement for a project.
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

    const { title, description, type } = data;

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

    return prisma.requirement.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type: requirementType,
        projectId: project.id,
      },
    });
  }

  /**
   * Get all requirements for a project with optional type filtering.
   */
  public static async getRequirementsByProjectId(
    projectId: string,
    query?: { type?: RequirementType },
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

    const where: { projectId: string; type?: RequirementType } = {
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
   * Update a requirement by ID.
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
