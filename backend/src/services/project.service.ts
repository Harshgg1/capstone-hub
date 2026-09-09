import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
  facultyId?: string | null;
  teamId?: string | null;
}

export class ProjectService {
  public static async createProject(data: { name: string; description?: string; teamId?: string }, user: { id: string; role: Role }) {
    const projectData: any = {
      name: data.name,
      description: data.description,
    };

    if (user.role === Role.FACULTY) {
      projectData.facultyId = user.id;
    }

    if (data.teamId) {
      projectData.teamId = data.teamId;
    }

    return prisma.project.create({
      data: projectData,
    });
  }

  public static async getProjects() {
    return prisma.project.findMany({
      include: {
        faculty: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public static async getProjectById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        faculty: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  public static async updateProject(
    id: string,
    data: UpdateProjectDTO,
    user: { id: string; role: Role }
  ) {
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        team: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!existingProject) {
      throw new AppError('Project not found', 404);
    }

    // Authorization check:
    // 1. Faculty users can update projects.
    // 2. Team leads of the assigned team can update the project.
    const isFaculty = user.role === Role.FACULTY;
    const isTeamLead =
      existingProject.team &&
      (existingProject.team.leadId === user.id ||
        existingProject.team.members.some(
          (m) => m.userId === user.id && m.role === Role.TEAM_LEAD
        ));

    if (!isFaculty && !isTeamLead) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const { name, description, facultyId, teamId } = data;

    if (
      name === undefined &&
      description === undefined &&
      facultyId === undefined &&
      teamId === undefined
    ) {
      throw new AppError('At least one field must be provided to update', 400);
    }

    const updateData: {
      name?: string;
      description?: string | null;
      facultyId?: string | null;
      teamId?: string | null;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        throw new AppError('Project name cannot be empty', 400);
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== 'string') {
        throw new AppError('Description must be a string or null', 400);
      }
      updateData.description = description !== null ? description.trim() : null;
    }

    if (facultyId !== undefined) {
      if (facultyId !== null) {
        if (typeof facultyId !== 'string' || !facultyId.trim()) {
          throw new AppError('Invalid facultyId format', 400);
        }
        const facultyUser = await prisma.user.findUnique({
          where: { id: facultyId },
        });
        if (!facultyUser) {
          throw new AppError('Faculty user not found', 400);
        }
        if (facultyUser.role !== Role.FACULTY) {
          throw new AppError('Assigned user must have FACULTY role', 400);
        }
        updateData.facultyId = facultyId;
      } else {
        updateData.facultyId = null;
      }
    }

    if (teamId !== undefined) {
      if (teamId !== null) {
        if (typeof teamId !== 'string' || !teamId.trim()) {
          throw new AppError('Invalid teamId format', 400);
        }
        const team = await prisma.team.findUnique({
          where: { id: teamId },
        });
        if (!team) {
          throw new AppError('Team not found', 400);
        }
        const conflictingProject = await prisma.project.findFirst({
          where: {
            teamId,
            NOT: { id },
          },
        });
        if (conflictingProject) {
          throw new AppError('Team is already assigned to another project', 400);
        }
        updateData.teamId = teamId;
      } else {
        updateData.teamId = null;
      }
    }

    return prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        faculty: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

