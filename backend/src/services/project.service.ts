import { prisma } from '../lib/prisma';
import { Role } from '@prisma/client';

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
}
