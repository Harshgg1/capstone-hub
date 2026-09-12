import { DeliverableStatus, DeliverableType, Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateDeliverableDTO {
  title: string;
  description?: string | null;
  type?: DeliverableType;
  status?: DeliverableStatus;
  fileUrl?: string | null;
  dueDate?: string | Date | null;
}

export interface UpdateDeliverableDTO {
  title?: string;
  description?: string | null;
  type?: DeliverableType;
  status?: DeliverableStatus;
  fileUrl?: string | null;
  dueDate?: string | Date | null;
  reviewFeedback?: string | null;
}

export enum ReviewAction {
  START_REVIEW = 'START_REVIEW',
  APPROVE = 'APPROVE',
  REQUEST_REVISION = 'REQUEST_REVISION',
}

export interface ReviewDeliverableDTO {
  action: ReviewAction;
  feedback?: string | null;
}

type ProjectWithTeam = {
  facultyId: string | null;
  teamId: string | null;
  team: {
    leadId: string | null;
    members: { userId: string; role: Role }[];
  } | null;
};

export class DeliverableService {
  /**
   * Returns true if the user can manage (create/update/delete) deliverables.
   * FACULTY always can; TEAM_LEAD of the project can too.
   */
  private static canManage(
    user: { id: string; role: Role },
    project: ProjectWithTeam
  ): boolean {
    if (user.role === Role.FACULTY) {
      return true;
    }
    if (!project.team) {
      return false;
    }
    return (
      project.team.leadId === user.id ||
      project.team.members.some(
        (m) => m.userId === user.id && m.role === Role.TEAM_LEAD
      )
    );
  }

  /**
   * Fetch project with team info; throws 404 if not found.
   */
  private static async fetchProject(projectId: string): Promise<ProjectWithTeam & { id: string }> {
    const project = await prisma.project.findUnique({
      where: { id: projectId.trim() },
      include: {
        team: {
          include: { members: true },
        },
      },
    });
    if (!project) {
      throw new AppError('Project not found', 404);
    }
    return project;
  }

  /**
   * Create a deliverable linked to a milestone (and its parent project).
   */
  public static async createDeliverable(
    milestoneId: string,
    data: CreateDeliverableDTO,
    user: { id: string; role: Role }
  ) {
    if (!milestoneId || typeof milestoneId !== 'string' || !milestoneId.trim()) {
      throw new AppError('Milestone ID is required', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId.trim() },
    });
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    const project = await this.fetchProject(milestone.projectId);

    if (!this.canManage(user, project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const { title, description, type, status, fileUrl, dueDate } = data;

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new AppError('Deliverable title is required', 400);
    }

    if (type !== undefined && !Object.values(DeliverableType).includes(type)) {
      throw new AppError(
        `Invalid deliverable type. Allowed: ${Object.values(DeliverableType).join(', ')}`,
        400
      );
    }

    if (status !== undefined && !Object.values(DeliverableStatus).includes(status)) {
      throw new AppError(
        `Invalid deliverable status. Allowed: ${Object.values(DeliverableStatus).join(', ')}`,
        400
      );
    }

    let parsedDueDate: Date | null = null;
    if (dueDate !== undefined && dueDate !== null) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        throw new AppError('Invalid due date format', 400);
      }
      parsedDueDate = parsed;
    }

    return prisma.deliverable.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        type: type ?? DeliverableType.OTHER,
        status: status ?? DeliverableStatus.DRAFT,
        fileUrl: fileUrl ? fileUrl.trim() : null,
        dueDate: parsedDueDate,
        milestoneId: milestone.id,
        projectId: project.id,
      },
      include: {
        milestone: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Get all deliverables for a milestone.
   */
  public static async getDeliverablesByMilestone(
    milestoneId: string,
    _user: { id: string; role: Role }
  ) {
    if (!milestoneId || typeof milestoneId !== 'string' || !milestoneId.trim()) {
      throw new AppError('Milestone ID is required', 400);
    }

    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId.trim() },
    });
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    return prisma.deliverable.findMany({
      where: { milestoneId: milestone.id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        milestone: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Get all deliverables for a project (across all milestones).
   */
  public static async getDeliverablesByProject(
    projectId: string,
    _user: { id: string; role: Role }
  ) {
    if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
      throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId.trim() },
    });
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    return prisma.deliverable.findMany({
      where: { projectId: project.id },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        milestone: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Get a single deliverable by ID.
   */
  public static async getDeliverableById(
    deliverableId: string,
    _user: { id: string; role: Role }
  ) {
    if (!deliverableId || typeof deliverableId !== 'string' || !deliverableId.trim()) {
      throw new AppError('Deliverable ID is required', 400);
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId.trim() },
      include: {
        milestone: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    return deliverable;
  }

  /**
   * Valid status transitions.
   * Key = current status, value = set of statuses it may transition to.
   *
   * Team side:  DRAFT → SUBMITTED, REVISION_REQUESTED → SUBMITTED
   * Faculty side: SUBMITTED → UNDER_REVIEW, UNDER_REVIEW → APPROVED | REVISION_REQUESTED
   * Any manager can revert SUBMITTED → DRAFT (e.g. withdraw before review starts).
   */
  private static readonly ALLOWED_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
    [DeliverableStatus.DRAFT]: [DeliverableStatus.SUBMITTED],
    [DeliverableStatus.SUBMITTED]: [DeliverableStatus.UNDER_REVIEW, DeliverableStatus.DRAFT],
    [DeliverableStatus.UNDER_REVIEW]: [
      DeliverableStatus.APPROVED,
      DeliverableStatus.REVISION_REQUESTED,
    ],
    [DeliverableStatus.APPROVED]: [],
    [DeliverableStatus.REVISION_REQUESTED]: [DeliverableStatus.SUBMITTED],
  };

  /**
   * Submit a deliverable for faculty review.
   * Allowed by TEAM_LEAD (or FACULTY acting as admin) when status is DRAFT or REVISION_REQUESTED.
   * Transitions the deliverable to SUBMITTED.
   */
  public static async submitDeliverable(
    deliverableId: string,
    user: { id: string; role: Role }
  ) {
    if (!deliverableId || typeof deliverableId !== 'string' || !deliverableId.trim()) {
      throw new AppError('Deliverable ID is required', 400);
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId.trim() },
      include: {
        project: {
          include: {
            team: { include: { members: true } },
          },
        },
      },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    if (!this.canManage(user, deliverable.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    const submittableStatuses: DeliverableStatus[] = [
      DeliverableStatus.DRAFT,
      DeliverableStatus.REVISION_REQUESTED,
    ];
    if (!submittableStatuses.includes(deliverable.status)) {
      throw new AppError(
        `Cannot submit a deliverable that is currently '${deliverable.status}'. ` +
          `Only DRAFT or REVISION_REQUESTED deliverables can be submitted for review.`,
        422
      );
    }

    return prisma.deliverable.update({
      where: { id: deliverable.id },
      data: { status: DeliverableStatus.SUBMITTED },
      include: {
        milestone: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Faculty review action on a deliverable.
   *
   * START_REVIEW:     SUBMITTED     → UNDER_REVIEW          (feedback optional)
   * APPROVE:          UNDER_REVIEW  → APPROVED              (feedback optional)
   * REQUEST_REVISION: UNDER_REVIEW  → REVISION_REQUESTED    (feedback required)
   *
   * Restricted to FACULTY only.
   */
  public static async reviewDeliverable(
    deliverableId: string,
    data: ReviewDeliverableDTO,
    user: { id: string; role: Role }
  ) {
    if (!deliverableId || typeof deliverableId !== 'string' || !deliverableId.trim()) {
      throw new AppError('Deliverable ID is required', 400);
    }

    if (user.role !== Role.FACULTY) {
      throw new AppError('Only FACULTY can perform review actions on deliverables', 403);
    }

    const { action, feedback } = data;

    if (!action || !Object.values(ReviewAction).includes(action)) {
      throw new AppError(
        `Invalid review action. Allowed: ${Object.values(ReviewAction).join(', ')}`,
        400
      );
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId.trim() },
      include: {
        milestone: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    // Determine the target status and validate the current state
    let targetStatus: DeliverableStatus;
    let requiredCurrentStatus: DeliverableStatus;
    let actionLabel: string;

    switch (action) {
      case ReviewAction.START_REVIEW:
        requiredCurrentStatus = DeliverableStatus.SUBMITTED;
        targetStatus = DeliverableStatus.UNDER_REVIEW;
        actionLabel = 'start review on';
        break;
      case ReviewAction.APPROVE:
        requiredCurrentStatus = DeliverableStatus.UNDER_REVIEW;
        targetStatus = DeliverableStatus.APPROVED;
        actionLabel = 'approve';
        break;
      case ReviewAction.REQUEST_REVISION:
        requiredCurrentStatus = DeliverableStatus.UNDER_REVIEW;
        targetStatus = DeliverableStatus.REVISION_REQUESTED;
        actionLabel = 'request revision on';
        break;
    }

    if (deliverable.status !== requiredCurrentStatus) {
      throw new AppError(
        `Cannot ${actionLabel} a deliverable with status '${deliverable.status}'. ` +
          `Expected status: '${requiredCurrentStatus}'.`,
        422
      );
    }

    if (action === ReviewAction.REQUEST_REVISION) {
      if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
        throw new AppError(
          'Feedback is required when requesting a revision',
          400
        );
      }
    }

    const trimmedFeedback = feedback?.trim() ?? null;

    return prisma.deliverable.update({
      where: { id: deliverable.id },
      data: {
        status: targetStatus,
        reviewFeedback: trimmedFeedback,
      },
      include: {
        milestone: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Update a deliverable by ID.
   * TEAM_LEAD/FACULTY can update most fields.
   * Only FACULTY can set status to APPROVED or REVISION_REQUESTED.
   * All status changes must follow the allowed transition map.
   */
  public static async updateDeliverable(
    deliverableId: string,
    data: UpdateDeliverableDTO,
    user: { id: string; role: Role }
  ) {
    if (!deliverableId || typeof deliverableId !== 'string' || !deliverableId.trim()) {
      throw new AppError('Deliverable ID is required', 400);
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId.trim() },
      include: {
        project: {
          include: {
            team: { include: { members: true } },
          },
        },
      },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    if (!this.canManage(user, deliverable.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    // Faculty-only statuses
    const facultyOnlyStatuses: DeliverableStatus[] = [
      DeliverableStatus.APPROVED,
      DeliverableStatus.REVISION_REQUESTED,
    ];
    if (
      data.status !== undefined &&
      facultyOnlyStatuses.includes(data.status) &&
      user.role !== Role.FACULTY
    ) {
      throw new AppError(
        'Only FACULTY can set status to APPROVED or REVISION_REQUESTED',
        403
      );
    }

    const updateData: {
      title?: string;
      description?: string | null;
      type?: DeliverableType;
      status?: DeliverableStatus;
      fileUrl?: string | null;
      dueDate?: Date | null;
      reviewFeedback?: string | null;
    } = {};

    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || !data.title.trim()) {
        throw new AppError('Deliverable title cannot be empty', 400);
      }
      updateData.title = data.title.trim();
    }

    if (data.description !== undefined) {
      updateData.description = data.description ? data.description.trim() : null;
    }

    if (data.type !== undefined) {
      if (!Object.values(DeliverableType).includes(data.type)) {
        throw new AppError(
          `Invalid deliverable type. Allowed: ${Object.values(DeliverableType).join(', ')}`,
          400
        );
      }
      updateData.type = data.type;
    }

    if (data.status !== undefined) {
      if (!Object.values(DeliverableStatus).includes(data.status)) {
        throw new AppError(
          `Invalid deliverable status. Allowed: ${Object.values(DeliverableStatus).join(', ')}`,
          400
        );
      }
      const allowed = this.ALLOWED_TRANSITIONS[deliverable.status];
      if (!allowed.includes(data.status)) {
        throw new AppError(
          `Invalid status transition: '${deliverable.status}' → '${data.status}'. ` +
            (allowed.length > 0
              ? `Allowed transitions: ${allowed.join(', ')}.`
              : `No further transitions are allowed from '${deliverable.status}'.`),
          422
        );
      }
      updateData.status = data.status;
    }

    if (data.fileUrl !== undefined) {
      updateData.fileUrl = data.fileUrl ? data.fileUrl.trim() : null;
    }

    if (data.dueDate !== undefined) {
      if (data.dueDate === null) {
        updateData.dueDate = null;
      } else {
        const parsed = new Date(data.dueDate);
        if (isNaN(parsed.getTime())) {
          throw new AppError('Invalid due date format', 400);
        }
        updateData.dueDate = parsed;
      }
    }

    if (data.reviewFeedback !== undefined) {
      updateData.reviewFeedback = data.reviewFeedback ? data.reviewFeedback.trim() : null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new AppError('At least one field must be provided to update', 400);
    }

    return prisma.deliverable.update({
      where: { id: deliverable.id },
      data: updateData,
      include: {
        milestone: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Delete a deliverable by ID. Only FACULTY or TEAM_LEAD can delete.
   */
  public static async deleteDeliverable(
    deliverableId: string,
    user: { id: string; role: Role }
  ) {
    if (!deliverableId || typeof deliverableId !== 'string' || !deliverableId.trim()) {
      throw new AppError('Deliverable ID is required', 400);
    }

    const deliverable = await prisma.deliverable.findUnique({
      where: { id: deliverableId.trim() },
      include: {
        project: {
          include: {
            team: { include: { members: true } },
          },
        },
      },
    });

    if (!deliverable) {
      throw new AppError('Deliverable not found', 404);
    }

    if (!this.canManage(user, deliverable.project)) {
      throw new AppError('Access denied: insufficient permissions', 403);
    }

    await prisma.deliverable.delete({ where: { id: deliverable.id } });

    return { message: 'Deliverable deleted successfully' };
  }
}
