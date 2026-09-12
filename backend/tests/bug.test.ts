import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    bug: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  },
}));

const mockPrisma = prisma as unknown as {
  project: { findUnique: ReturnType<typeof vi.fn> };
  bug: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  user: {
    findUnique: ReturnType<typeof vi.fn>;
  }
};

describe('Bug API Endpoints', () => {
  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'TEAM_MEMBER',
  };

  const teamLead = {
    id: 'lead-1',
    email: 'lead@example.com',
    role: 'TEAM_LEAD',
  };

  const mockToken = jwt.sign(mockUser, config.jwtSecret);
  const leadToken = jwt.sign(teamLead, config.jwtSecret);

  const mockProject = {
    id: 'proj-1',
    name: 'Test Project',
    team: {
      leadId: teamLead.id,
      members: [
        { userId: mockUser.id, role: 'TEAM_MEMBER' },
        { userId: teamLead.id, role: 'TEAM_LEAD' }
      ],
    },
  };

  const mockBug = {
    id: 'bug-1',
    title: 'Test Bug',
    description: 'Bug description',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    status: 'OPEN',
    projectId: mockProject.id,
    reporterId: mockUser.id,
    assigneeId: null,
    project: mockProject,
    reporter: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/bugs/:id', () => {
    it('allows assignee assignment by TEAM_LEAD', async () => {
      mockPrisma.bug.findUnique.mockResolvedValue(mockBug);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.bug.update.mockResolvedValue({
        ...mockBug,
        assigneeId: mockUser.id,
      });

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ assigneeId: mockUser.id });

      expect(res.status).toBe(200);
      expect(mockPrisma.bug.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assigneeId: mockUser.id }),
        })
      );
    });

    it('denies assignment by TEAM_MEMBER (unless reporter or assignee? No, only manager)', async () => {
      // Mock user is the reporter, but reporters can't assign bugs, only managers can
      mockPrisma.bug.findUnique.mockResolvedValue(mockBug);

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ assigneeId: mockUser.id });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Only team lead or faculty can assign bugs');
    });

    it('allows valid status transition by assignee', async () => {
      const bugAssignedToMe = { ...mockBug, assigneeId: mockUser.id };
      mockPrisma.bug.findUnique.mockResolvedValue(bugAssignedToMe);
      mockPrisma.bug.update.mockResolvedValue({
        ...bugAssignedToMe,
        status: 'IN_PROGRESS',
      });

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(200);
      expect(mockPrisma.bug.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'IN_PROGRESS' }),
        })
      );
    });

    it('denies invalid status transition (OPEN -> CLOSED)', async () => {
      mockPrisma.bug.findUnique.mockResolvedValue(mockBug);

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${leadToken}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(422);
      expect(res.body.error).toContain('Invalid status transition');
    });

    it('denies team member closing a bug (unless reporter)', async () => {
      const bugReportedBySomeoneElse = { ...mockBug, reporterId: 'other-id', assigneeId: mockUser.id, status: 'RESOLVED' };
      mockPrisma.bug.findUnique.mockResolvedValue(bugReportedBySomeoneElse);

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('reopen or close');
    });

    it('allows reporter to close a bug', async () => {
      const bugReportedByMe = { ...mockBug, reporterId: mockUser.id, status: 'RESOLVED' };
      mockPrisma.bug.findUnique.mockResolvedValue(bugReportedByMe);
      mockPrisma.bug.update.mockResolvedValue({
        ...bugReportedByMe,
        status: 'CLOSED',
      });

      const res = await request(app)
        .put('/api/bugs/bug-1')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ status: 'CLOSED' });

      expect(res.status).toBe(200);
    });
  });
});
