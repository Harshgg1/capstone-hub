import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Project API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateToken = (payload: { id: string; email: string; role: Role }) => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
  };

  const facultyUser = {
    id: 'faculty-uuid-1',
    email: 'prof.smith@example.com',
    role: Role.FACULTY,
  };

  const teamLeadUser = {
    id: 'lead-uuid-1',
    email: 'alice.lead@example.com',
    role: Role.TEAM_LEAD,
  };

  const otherTeamLeadUser = {
    id: 'other-lead-uuid-2',
    email: 'bob.lead@example.com',
    role: Role.TEAM_LEAD,
  };

  const teamMemberUser = {
    id: 'member-uuid-1',
    email: 'charlie.member@example.com',
    role: Role.TEAM_MEMBER,
  };

  const mockProject = {
    id: 'proj-uuid-1',
    name: 'CapstoneHub Platform',
    description: 'Academic project management',
    facultyId: 'faculty-uuid-1',
    teamId: 'team-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    team: {
      id: 'team-uuid-1',
      name: 'Alpha Team',
      leadId: 'lead-uuid-1',
      members: [
        {
          id: 'tm-1',
          teamId: 'team-uuid-1',
          userId: 'lead-uuid-1',
          role: Role.TEAM_LEAD,
        },
        {
          id: 'tm-2',
          teamId: 'team-uuid-1',
          userId: 'member-uuid-1',
          role: Role.TEAM_MEMBER,
        },
      ],
    },
    faculty: {
      id: 'faculty-uuid-1',
      name: 'Prof Smith',
      email: 'prof.smith@example.com',
    },
  };

  describe('PUT /api/projects/:id & PATCH /api/projects/:id', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 if project is not found', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .put('/api/projects/nonexistent-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Project Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');
    });

    it('should return 403 if user is a TEAM_MEMBER', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unauthorized Change' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied: insufficient permissions');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 403 if user is a TEAM_LEAD of an unrelated team', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const token = generateToken(otherTeamLeadUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Unauthorized Change from Other Lead' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied: insufficient permissions');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if no update fields are provided', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('At least one field must be provided to update');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if project name is empty or whitespace', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project name cannot be empty');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if facultyId does not exist', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .patch('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ facultyId: 'nonexistent-faculty' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Faculty user not found');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if assigned faculty user does not have FACULTY role', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.user.findUnique as any).mockResolvedValue({
        id: 'user-not-faculty',
        role: Role.TEAM_MEMBER,
      });

      const token = generateToken(facultyUser);
      const response = await request(app)
        .patch('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ facultyId: 'user-not-faculty' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Assigned user must have FACULTY role');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if teamId does not exist', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.team.findUnique as any).mockResolvedValue(null);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .patch('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ teamId: 'nonexistent-team' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Team not found');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should return 400 if teamId is already assigned to another project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      (prisma.team.findUnique as any).mockResolvedValue({
        id: 'team-uuid-2',
        name: 'Beta Team',
      });
      (prisma.project.findFirst as any).mockResolvedValue({
        id: 'other-proj-id',
        name: 'Other Project',
        teamId: 'team-uuid-2',
      });

      const token = generateToken(facultyUser);
      const response = await request(app)
        .patch('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ teamId: 'team-uuid-2' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Team is already assigned to another project');
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('should allow FACULTY to update project information successfully via PUT', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      const updatedProject = {
        ...mockProject,
        name: 'Updated Capstone Name',
        description: 'Updated Description',
      };
      (prisma.project.update as any).mockResolvedValue(updatedProject);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Capstone Name',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.data.name).toBe('Updated Capstone Name');
      expect(response.body.data.description).toBe('Updated Description');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-uuid-1' },
        data: {
          name: 'Updated Capstone Name',
          description: 'Updated Description',
        },
        include: {
          faculty: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should allow designated TEAM_LEAD of project team to update project via PATCH', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      const updatedProject = {
        ...mockProject,
        name: 'Patched Name by Lead',
      };
      (prisma.project.update as any).mockResolvedValue(updatedProject);

      const token = generateToken(teamLeadUser);
      const response = await request(app)
        .patch('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Patched Name by Lead',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project updated successfully');
      expect(response.body.data.name).toBe('Patched Name by Lead');
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-uuid-1' },
        data: {
          name: 'Patched Name by Lead',
        },
        include: {
          faculty: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      });
    });

    it('should allow unsetting optional fields by setting to null', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProject);
      const updatedProject = {
        ...mockProject,
        description: null,
        facultyId: null,
        teamId: null,
        faculty: null,
        team: null,
      };
      (prisma.project.update as any).mockResolvedValue(updatedProject);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .put('/api/projects/proj-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: null,
          facultyId: null,
          teamId: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-uuid-1' },
        data: {
          description: null,
          facultyId: null,
          teamId: null,
        },
        include: {
          faculty: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
        },
      });
    });
  });
});
