import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role, MilestoneStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    milestone: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Milestone API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const generateToken = (payload: { id: string; email: string; role: Role }) => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
  };

  const facultyUser = {
    id: 'faculty-uuid-1',
    email: 'faculty@example.com',
    role: Role.FACULTY,
  };

  const teamLeadUser = {
    id: 'lead-uuid-1',
    email: 'lead@example.com',
    role: Role.TEAM_LEAD,
  };

  const teamMemberUser = {
    id: 'member-uuid-1',
    email: 'member@example.com',
    role: Role.TEAM_MEMBER,
  };

  const mockProjectWithTeam = {
    id: 'proj-uuid-1',
    name: 'Capstone Platform',
    facultyId: 'faculty-uuid-1',
    teamId: 'team-uuid-1',
    team: {
      id: 'team-uuid-1',
      name: 'Alpha Team',
      leadId: 'lead-uuid-1',
      members: [
        { teamId: 'team-uuid-1', userId: 'lead-uuid-1', role: Role.TEAM_LEAD },
        { teamId: 'team-uuid-1', userId: 'member-uuid-1', role: Role.TEAM_MEMBER },
      ],
    },
  };

  const mockMilestone = {
    id: 'milestone-uuid-1',
    title: 'Milestone 1: Inception & Architecture',
    description: 'Complete architecture specifications and initial prototype',
    dueDate: new Date('2026-10-15T00:00:00.000Z'),
    status: MilestoneStatus.UPCOMING,
    projectId: 'proj-uuid-1',
    project: mockProjectWithTeam,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('POST /api/projects/:projectId/milestones - Create Milestone', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .send({ title: 'Milestone 1' });

      expect(response.status).toBe(401);
    });

    it('should return 404 if project is not found', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/nonexistent-proj/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 1' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Project not found');
    });

    it('should return 403 if requester is a regular TEAM_MEMBER', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 1' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('insufficient permissions');
    });

    it('should return 400 if title is missing or empty', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('title is required');
    });

    it('should return 400 if dueDate is invalid', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 1', dueDate: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid due date format');
    });

    it('should return 400 if status is invalid', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Milestone 1', status: 'INVALID_STATUS' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid milestone status');
    });

    it('should allow FACULTY to create milestone successfully', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.milestone.create as any).mockResolvedValue(mockMilestone);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Milestone 1: Inception & Architecture',
          description: 'Complete architecture specifications and initial prototype',
          dueDate: '2026-10-15T00:00:00.000Z',
          status: MilestoneStatus.UPCOMING,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(mockMilestone.title);
      expect(prisma.milestone.create).toHaveBeenCalledWith({
        data: {
          title: 'Milestone 1: Inception & Architecture',
          description: 'Complete architecture specifications and initial prototype',
          dueDate: new Date('2026-10-15T00:00:00.000Z'),
          status: MilestoneStatus.UPCOMING,
          projectId: 'proj-uuid-1',
        },
      });
    });

    it('should allow TEAM_LEAD to create milestone successfully', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.milestone.create as any).mockResolvedValue(mockMilestone);

      const token = generateToken(teamLeadUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Milestone 1: Inception & Architecture',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/projects/:projectId/milestones - Get Project Milestones', () => {
    it('should retrieve all milestones for a project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.milestone.findMany as any).mockResolvedValue([mockMilestone]);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/projects/proj-uuid-1/milestones')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe('milestone-uuid-1');
    });

    it('should return 404 if project is not found', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/projects/nonexistent-proj/milestones')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/milestones/:id - Get Milestone By ID', () => {
    it('should retrieve milestone by ID', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('milestone-uuid-1');
    });

    it('should return 404 if milestone not found', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(null);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/milestones/nonexistent-milestone')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/milestones/:id - Update Milestone', () => {
    it('should return 403 if requester is a regular TEAM_MEMBER', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .patch('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: MilestoneStatus.IN_PROGRESS });

      expect(response.status).toBe(403);
    });

    it('should allow TEAM_LEAD to update milestone status and description', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);
      const updatedMilestone = {
        ...mockMilestone,
        status: MilestoneStatus.IN_PROGRESS,
        description: 'Updated description',
      };
      (prisma.milestone.update as any).mockResolvedValue(updatedMilestone);

      const token = generateToken(teamLeadUser);
      const response = await request(app)
        .patch('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: MilestoneStatus.IN_PROGRESS,
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(prisma.milestone.update).toHaveBeenCalledWith({
        where: { id: 'milestone-uuid-1' },
        data: {
          status: MilestoneStatus.IN_PROGRESS,
          description: 'Updated description',
        },
      });
    });

    it('should return 400 if no fields are provided to update', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .patch('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('At least one field must be provided');
    });
  });

  describe('DELETE /api/milestones/:id - Delete Milestone', () => {
    it('should return 403 if regular TEAM_MEMBER attempts deletion', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .delete('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should allow FACULTY to delete milestone', async () => {
      (prisma.milestone.findUnique as any).mockResolvedValue(mockMilestone);
      (prisma.milestone.delete as any).mockResolvedValue(mockMilestone);

      const token = generateToken(facultyUser);
      const response = await request(app)
        .delete('/api/milestones/milestone-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(prisma.milestone.delete).toHaveBeenCalledWith({
        where: { id: 'milestone-uuid-1' },
      });
    });
  });
});
