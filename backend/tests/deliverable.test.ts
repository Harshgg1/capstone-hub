import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    milestone: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
    deliverable: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  milestone: { findUnique: ReturnType<typeof vi.fn> };
  project: { findUnique: ReturnType<typeof vi.fn> };
  deliverable: {
    create: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

function makeToken(payload: object) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
}

const facultyUser = { id: 'faculty-1', email: 'faculty@test.com', role: 'FACULTY' };
const teamLeadUser = { id: 'lead-1', email: 'lead@test.com', role: 'TEAM_LEAD' };
const memberUser = { id: 'member-1', email: 'member@test.com', role: 'TEAM_MEMBER' };

const facultyToken = makeToken(facultyUser);
const teamLeadToken = makeToken(teamLeadUser);
const memberToken = makeToken(memberUser);

const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  facultyId: 'faculty-1',
  teamId: 'team-1',
  team: {
    leadId: 'lead-1',
    members: [
      { userId: 'lead-1', role: 'TEAM_LEAD' },
      { userId: 'member-1', role: 'TEAM_MEMBER' },
    ],
  },
};

const mockMilestone = {
  id: 'milestone-1',
  title: 'Milestone 1',
  projectId: 'project-1',
};

const mockDeliverable = {
  id: 'deliverable-1',
  title: 'SRS Document',
  description: 'Software Requirements Specification',
  type: 'SRS_DOCUMENT',
  status: 'DRAFT',
  fileUrl: null,
  dueDate: null,
  reviewFeedback: null,
  milestoneId: 'milestone-1',
  projectId: 'project-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  milestone: { id: 'milestone-1', title: 'Milestone 1' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── POST /api/milestones/:milestoneId/deliverables ────────────────────────

describe('POST /api/milestones/:milestoneId/deliverables', () => {
  it('creates a deliverable as FACULTY', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);
    mockPrisma.deliverable.create.mockResolvedValue(mockDeliverable);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'SRS Document', type: 'SRS_DOCUMENT' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('SRS Document');
    expect(mockPrisma.deliverable.create).toHaveBeenCalledOnce();
  });

  it('creates a deliverable as TEAM_LEAD', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);
    mockPrisma.deliverable.create.mockResolvedValue(mockDeliverable);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({ title: 'SRS Document' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('returns 403 for TEAM_MEMBER', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'SRS Document' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .send({ title: 'SRS Document' });

    expect(res.status).toBe(401);
  });

  it('returns 400 if title is missing', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('title');
  });

  it('returns 404 if milestone not found', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/milestones/nonexistent/deliverables')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Milestone not found');
  });

  it('returns 400 for invalid deliverable type', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'Test', type: 'INVALID_TYPE' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid deliverable type');
  });

  it('returns 400 for invalid due date', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);

    const res = await request(app)
      .post('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'Test', dueDate: 'not-a-date' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid due date');
  });
});

// ─── GET /api/milestones/:milestoneId/deliverables ────────────────────────

describe('GET /api/milestones/:milestoneId/deliverables', () => {
  it('returns deliverables for a milestone', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(mockMilestone);
    mockPrisma.deliverable.findMany.mockResolvedValue([mockDeliverable]);

    const res = await request(app)
      .get('/api/milestones/milestone-1/deliverables')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 404 if milestone not found', async () => {
    mockPrisma.milestone.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/milestones/nonexistent/deliverables')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/milestones/milestone-1/deliverables');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/projects/:projectId/deliverables ───────────────────────────

describe('GET /api/projects/:projectId/deliverables', () => {
  it('returns all deliverables for a project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);
    mockPrisma.deliverable.findMany.mockResolvedValue([mockDeliverable]);

    const res = await request(app)
      .get('/api/projects/project-1/deliverables')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns 404 if project not found', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/projects/nonexistent/deliverables')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });
});

// ─── GET /api/deliverables/:id ────────────────────────────────────────────

describe('GET /api/deliverables/:id', () => {
  it('returns a deliverable by ID', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      project: { id: 'project-1', name: 'Test Project' },
    });

    const res = await request(app)
      .get('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('deliverable-1');
  });

  it('returns 404 if deliverable not found', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/deliverables/nonexistent')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/api/deliverables/deliverable-1');
    expect(res.status).toBe(401);
  });
});

// ─── PUT /api/deliverables/:id ────────────────────────────────────────────

describe('PUT /api/deliverables/:id', () => {
  const deliverableWithProject = {
    ...mockDeliverable,
    project: mockProject,
  };

  it('updates a deliverable as FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      title: 'Updated SRS',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'Updated SRS' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('updated');
  });

  it('updates a deliverable as TEAM_LEAD', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'SUBMITTED',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({ status: 'SUBMITTED' });

    expect(res.status).toBe(200);
  });

  it('returns 403 when TEAM_MEMBER tries to update', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Sneaky Update' });

    expect(res.status).toBe(403);
  });

  it('returns 403 when non-FACULTY tries to set APPROVED status', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('FACULTY');
  });

  it('FACULTY can set APPROVED status (from UNDER_REVIEW)', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...deliverableWithProject,
      status: 'UNDER_REVIEW',
    });
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'APPROVED',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when no fields are provided', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('At least one field');
  });

  it('returns 404 if deliverable not found', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/deliverables/nonexistent')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/deliverables/:id ─────────────────────────────────────────

describe('DELETE /api/deliverables/:id', () => {
  const deliverableWithProject = {
    ...mockDeliverable,
    project: mockProject,
  };

  it('deletes a deliverable as FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);
    mockPrisma.deliverable.delete.mockResolvedValue(mockDeliverable);

    const res = await request(app)
      .delete('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('deleted');
  });

  it('deletes a deliverable as TEAM_LEAD', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);
    mockPrisma.deliverable.delete.mockResolvedValue(mockDeliverable);

    const res = await request(app)
      .delete('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${teamLeadToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 403 for TEAM_MEMBER', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(deliverableWithProject);

    const res = await request(app)
      .delete('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 if deliverable not found', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/deliverables/nonexistent')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).delete('/api/deliverables/deliverable-1');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/deliverables/:id/submit ────────────────────────────────────

describe('POST /api/deliverables/:id/submit', () => {
  const draftDeliverableWithProject = {
    ...mockDeliverable,
    status: 'DRAFT',
    project: mockProject,
  };

  const revisionDeliverableWithProject = {
    ...mockDeliverable,
    status: 'REVISION_REQUESTED',
    project: mockProject,
  };

  const submittedDeliverableWithProject = {
    ...mockDeliverable,
    status: 'SUBMITTED',
    project: mockProject,
  };

  it('submits a DRAFT deliverable as FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(draftDeliverableWithProject);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'SUBMITTED',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('submitted');
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('submits a DRAFT deliverable as TEAM_LEAD', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(draftDeliverableWithProject);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'SUBMITTED',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${teamLeadToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(mockPrisma.deliverable.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'SUBMITTED' } })
    );
  });

  it('submits a REVISION_REQUESTED deliverable (resubmission)', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(revisionDeliverableWithProject);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'SUBMITTED',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${teamLeadToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SUBMITTED');
  });

  it('returns 422 when deliverable is already SUBMITTED', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(submittedDeliverableWithProject);

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('SUBMITTED');
  });

  it('returns 422 when deliverable is APPROVED', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'APPROVED',
      project: mockProject,
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('APPROVED');
  });

  it('returns 422 when deliverable is UNDER_REVIEW', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'UNDER_REVIEW',
      project: mockProject,
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('UNDER_REVIEW');
  });

  it('returns 403 for TEAM_MEMBER', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(draftDeliverableWithProject);

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/submit')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 404 if deliverable not found', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/deliverables/nonexistent/submit')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).post('/api/deliverables/deliverable-1/submit');
    expect(res.status).toBe(401);
  });
});

// ─── Status transition validation in PUT ──────────────────────────────────

describe('PUT /api/deliverables/:id — status transition validation', () => {
  it('rejects invalid transition DRAFT → APPROVED (422)', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'DRAFT',
      project: mockProject,
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('DRAFT');
    expect(res.body.error).toContain('APPROVED');
  });

  it('rejects invalid transition APPROVED → DRAFT (422)', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'APPROVED',
      project: mockProject,
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'DRAFT' });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('No further transitions');
  });

  it('allows valid transition SUBMITTED → UNDER_REVIEW by FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'SUBMITTED',
      project: mockProject,
    });
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'UNDER_REVIEW',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'UNDER_REVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
  });

  it('allows valid transition UNDER_REVIEW → APPROVED by FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'UNDER_REVIEW',
      project: mockProject,
    });
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'APPROVED',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('allows valid transition UNDER_REVIEW → REVISION_REQUESTED by FACULTY', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'UNDER_REVIEW',
      project: mockProject,
    });
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'REVISION_REQUESTED',
    });

    const res = await request(app)
      .put('/api/deliverables/deliverable-1')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ status: 'REVISION_REQUESTED', reviewFeedback: 'Please fix section 3.' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REVISION_REQUESTED');
  });
});

// ─── POST /api/deliverables/:id/review ────────────────────────────────────

describe('POST /api/deliverables/:id/review', () => {
  const submittedDeliverable = {
    ...mockDeliverable,
    status: 'SUBMITTED',
    project: mockProject,
  };
  const underReviewDeliverable = {
    ...mockDeliverable,
    status: 'UNDER_REVIEW',
    project: mockProject,
  };

  it('allows FACULTY to START_REVIEW', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(submittedDeliverable);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'UNDER_REVIEW',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'START_REVIEW' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('UNDER_REVIEW');
  });

  it('allows FACULTY to APPROVE', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(underReviewDeliverable);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'APPROVED',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('allows FACULTY to REQUEST_REVISION with feedback', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(underReviewDeliverable);
    mockPrisma.deliverable.update.mockResolvedValue({
      ...mockDeliverable,
      status: 'REVISION_REQUESTED',
      reviewFeedback: 'Needs more detail',
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'REQUEST_REVISION', feedback: 'Needs more detail' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REVISION_REQUESTED');
  });

  it('returns 400 if REQUEST_REVISION is missing feedback', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue(underReviewDeliverable);

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'REQUEST_REVISION' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Feedback is required');
  });

  it('returns 422 if START_REVIEW is called on non-SUBMITTED', async () => {
    mockPrisma.deliverable.findUnique.mockResolvedValue({
      ...mockDeliverable,
      status: 'DRAFT',
      project: mockProject,
    });

    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'START_REVIEW' });

    expect(res.status).toBe(422);
  });

  it('returns 403 if TEAM_LEAD tries to review', async () => {
    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${teamLeadToken}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid action', async () => {
    const res = await request(app)
      .post('/api/deliverables/deliverable-1/review')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ action: 'INVALID_ACTION' });

    expect(res.status).toBe(400);
  });
});
