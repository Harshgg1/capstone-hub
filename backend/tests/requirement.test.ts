import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role, RequirementType, RequirementPriority, RequirementStatus } from '@prisma/client';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    requirement: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Requirement API', () => {
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

  const outsiderUser = {
    id: 'outsider-uuid-1',
    email: 'outsider@example.com',
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

  const mockFunctionalRequirement = {
    id: 'req-uuid-1',
    title: 'User Authentication',
    description: 'System must allow users to register and login using JWT tokens',
    type: RequirementType.FUNCTIONAL,
    priority: RequirementPriority.HIGH,
    status: RequirementStatus.DRAFT,
    projectId: 'proj-uuid-1',
    project: mockProjectWithTeam,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNonFunctionalRequirement = {
    id: 'req-uuid-2',
    title: 'Response Time Performance',
    description: 'API response times should not exceed 200ms under 500 concurrent users',
    type: RequirementType.NON_FUNCTIONAL,
    priority: RequirementPriority.MEDIUM,
    status: RequirementStatus.IN_REVIEW,
    projectId: 'proj-uuid-1',
    project: mockProjectWithTeam,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('POST /api/projects/:projectId/requirements - Create Requirement', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .send({ title: 'Req 1', description: 'Desc' });

      expect(response.status).toBe(401);
    });

    it('should return 404 if project is not found', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(null);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/nonexistent-proj/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Req 1', description: 'Desc' });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Project not found');
    });

    it('should return 403 if requester is not associated with the project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(outsiderUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Req 1', description: 'Desc' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('insufficient permissions');
    });

    it('should return 400 if title is missing or empty', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '   ', description: 'Some description' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('title is required');
    });

    it('should return 400 if description is missing or empty', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Valid Title', description: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('description is required');
    });

    it('should return 400 if type is invalid', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Valid Title',
          description: 'Valid Desc',
          type: 'INVALID_TYPE',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid requirement type');
    });

    it('should return 400 if priority is invalid', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Valid Title',
          description: 'Valid Desc',
          priority: 'SUPER_URGENT',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid requirement priority');
    });

    it('should return 400 if status is invalid', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Valid Title',
          description: 'Valid Desc',
          status: 'RANDOM_STATUS',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid requirement status');
    });

    it('should allow project team member to create a requirement with explicit priority and status', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.create as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'User Authentication',
          description: 'System must allow users to register and login using JWT tokens',
          type: RequirementType.FUNCTIONAL,
          priority: RequirementPriority.HIGH,
          status: RequirementStatus.DRAFT,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(mockFunctionalRequirement.title);
      expect(response.body.data.type).toBe(RequirementType.FUNCTIONAL);
      expect(response.body.data.priority).toBe(RequirementPriority.HIGH);
      expect(response.body.data.status).toBe(RequirementStatus.DRAFT);
      expect(prisma.requirement.create).toHaveBeenCalledWith({
        data: {
          title: 'User Authentication',
          description: 'System must allow users to register and login using JWT tokens',
          type: RequirementType.FUNCTIONAL,
          priority: RequirementPriority.HIGH,
          status: RequirementStatus.DRAFT,
          projectId: 'proj-uuid-1',
        },
      });
    });

    it('should allow FACULTY to create a requirement with default priority and status', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.create as any).mockResolvedValue({
        ...mockNonFunctionalRequirement,
        priority: RequirementPriority.MEDIUM,
        status: RequirementStatus.DRAFT,
      });

      const token = generateToken(facultyUser);
      const response = await request(app)
        .post('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Response Time Performance',
          description: 'API response times should not exceed 200ms under 500 concurrent users',
          type: RequirementType.NON_FUNCTIONAL,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(prisma.requirement.create).toHaveBeenCalledWith({
        data: {
          title: 'Response Time Performance',
          description: 'API response times should not exceed 200ms under 500 concurrent users',
          type: RequirementType.NON_FUNCTIONAL,
          priority: RequirementPriority.MEDIUM,
          status: RequirementStatus.DRAFT,
          projectId: 'proj-uuid-1',
        },
      });
    });
  });

  describe('GET /api/projects/:projectId/requirements - Get Project Requirements', () => {
    it('should retrieve all requirements for a project', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.findMany as any).mockResolvedValue([
        mockFunctionalRequirement,
        mockNonFunctionalRequirement,
      ]);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/projects/proj-uuid-1/requirements')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should filter requirements by priority and status when query params provided', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.findMany as any).mockResolvedValue([mockFunctionalRequirement]);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/projects/proj-uuid-1/requirements?priority=HIGH&status=DRAFT')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(prisma.requirement.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'proj-uuid-1',
          priority: RequirementPriority.HIGH,
          status: RequirementStatus.DRAFT,
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('GET /api/requirements/:id - Get Requirement By ID', () => {
    it('should retrieve requirement by ID', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('req-uuid-1');
      expect(response.body.data.priority).toBe(RequirementPriority.HIGH);
      expect(response.body.data.status).toBe(RequirementStatus.DRAFT);
    });

    it('should return 404 if requirement not found', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(null);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/requirements/nonexistent-req')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/requirements/:id - Update Requirement', () => {
    it('should return 403 if requester is not authorized', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(outsiderUser);
      const response = await request(app)
        .patch('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title' });

      expect(response.status).toBe(403);
    });

    it('should allow updating priority and transitioning status through workflow (DRAFT -> IN_REVIEW)', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);
      const updatedReq = {
        ...mockFunctionalRequirement,
        priority: RequirementPriority.CRITICAL,
        status: RequirementStatus.IN_REVIEW,
      };
      (prisma.requirement.update as any).mockResolvedValue(updatedReq);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .patch('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          priority: RequirementPriority.CRITICAL,
          status: RequirementStatus.IN_REVIEW,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.priority).toBe(RequirementPriority.CRITICAL);
      expect(response.body.data.status).toBe(RequirementStatus.IN_REVIEW);
      expect(prisma.requirement.update).toHaveBeenCalledWith({
        where: { id: 'req-uuid-1' },
        data: {
          priority: RequirementPriority.CRITICAL,
          status: RequirementStatus.IN_REVIEW,
        },
      });
    });

    it('should reject invalid status workflow transition (DRAFT -> COMPLETED)', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(teamLeadUser);
      const response = await request(app)
        .patch('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: RequirementStatus.COMPLETED,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid status transition from DRAFT to COMPLETED');
    });

    it('should return 400 if no fields are provided', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(teamLeadUser);
      const response = await request(app)
        .patch('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('At least one field must be provided');
    });
  });

  describe('DELETE /api/requirements/:id - Delete Requirement', () => {
    it('should return 403 if unauthorized user attempts deletion', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(outsiderUser);
      const response = await request(app)
        .delete('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('should allow team member to delete requirement', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);
      (prisma.requirement.delete as any).mockResolvedValue(mockFunctionalRequirement);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .delete('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
      expect(prisma.requirement.delete).toHaveBeenCalledWith({
        where: { id: 'req-uuid-1' },
      });
    });
  });
});
