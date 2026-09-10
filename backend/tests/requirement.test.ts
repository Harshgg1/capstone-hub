import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Role, RequirementType } from '@prisma/client';
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

    it('should allow project team member to create a FUNCTIONAL requirement', async () => {
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
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(mockFunctionalRequirement.title);
      expect(response.body.data.type).toBe(RequirementType.FUNCTIONAL);
      expect(prisma.requirement.create).toHaveBeenCalledWith({
        data: {
          title: 'User Authentication',
          description: 'System must allow users to register and login using JWT tokens',
          type: RequirementType.FUNCTIONAL,
          projectId: 'proj-uuid-1',
        },
      });
    });

    it('should allow FACULTY to create a NON_FUNCTIONAL requirement', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.create as any).mockResolvedValue(mockNonFunctionalRequirement);

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
      expect(response.body.data.type).toBe(RequirementType.NON_FUNCTIONAL);
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

    it('should filter requirements by type when query param provided', async () => {
      (prisma.project.findUnique as any).mockResolvedValue(mockProjectWithTeam);
      (prisma.requirement.findMany as any).mockResolvedValue([mockNonFunctionalRequirement]);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .get('/api/projects/proj-uuid-1/requirements?type=NON_FUNCTIONAL')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(prisma.requirement.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'proj-uuid-1',
          type: RequirementType.NON_FUNCTIONAL,
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

    it('should allow project team member to update requirement', async () => {
      (prisma.requirement.findUnique as any).mockResolvedValue(mockFunctionalRequirement);
      const updatedReq = {
        ...mockFunctionalRequirement,
        title: 'Enhanced Authentication',
        description: 'Updated auth description',
      };
      (prisma.requirement.update as any).mockResolvedValue(updatedReq);

      const token = generateToken(teamMemberUser);
      const response = await request(app)
        .patch('/api/requirements/req-uuid-1')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Enhanced Authentication',
          description: 'Updated auth description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Enhanced Authentication');
      expect(prisma.requirement.update).toHaveBeenCalledWith({
        where: { id: 'req-uuid-1' },
        data: {
          title: 'Enhanced Authentication',
          description: 'Updated auth description',
        },
      });
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
