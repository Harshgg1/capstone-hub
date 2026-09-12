import { PrismaClient, Role, RequirementType, RequirementPriority, RequirementStatus, UserStoryPriority, UserStoryStatus, SprintStatus, TaskStatus, MilestoneStatus, DeliverableType, DeliverableStatus, BugPriority, BugSeverity, BugStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CapstoneHub database seeding...');

  // Clean existing data in order of foreign key constraints
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.gitHubConnection.deleteMany();
  await prisma.bug.deleteMany();
  await prisma.deliverable.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.requirementUserStory.deleteMany();
  await prisma.userStory.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.requirementVersion.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const faculty = await prisma.user.create({
    data: {
      email: 'faculty@example.com',
      password: hashedPassword,
      name: 'Dr. Alan Turing',
      role: Role.FACULTY,
    },
  });

  const lead = await prisma.user.create({
    data: {
      email: 'lead@example.com',
      password: hashedPassword,
      name: 'Alice Smith (Lead)',
      role: Role.TEAM_LEAD,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      password: hashedPassword,
      name: 'Bob Jones',
      role: Role.TEAM_MEMBER,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      password: hashedPassword,
      name: 'Charlie Brown',
      role: Role.TEAM_MEMBER,
    },
  });

  const unassignedStudent = await prisma.user.create({
    data: {
      email: 'dave@example.com',
      password: hashedPassword,
      name: 'Dave Miller',
      role: Role.TEAM_MEMBER,
    },
  });

  console.log('👤 Created Users: Faculty, Lead, Team Members, and Unassigned Student.');

  // 2. Create Team
  const team = await prisma.team.create({
    data: {
      name: 'Alpha Team',
      leadId: lead.id,
      members: {
        create: [
          { userId: lead.id, role: Role.TEAM_LEAD },
          { userId: member1.id, role: Role.TEAM_MEMBER },
          { userId: member2.id, role: Role.TEAM_MEMBER },
        ],
      },
    },
  });

  console.log('👥 Created Team: Alpha Team with 3 members.');

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      name: 'CapstoneHub Management System',
      description: 'A comprehensive academic project management and software engineering lifecycle platform.',
      facultyId: faculty.id,
      teamId: team.id,
    },
  });

  console.log('📁 Created Project: CapstoneHub Management System.');

  // 4. Create Requirements & Versions
  const req1 = await prisma.requirement.create({
    data: {
      title: 'User Authentication & Role-Based Access Control',
      description: 'The system must support JWT authentication with student, team lead, and faculty roles.',
      type: RequirementType.FUNCTIONAL,
      priority: RequirementPriority.HIGH,
      status: RequirementStatus.APPROVED,
      projectId: project.id,
      versions: {
        create: [
          {
            versionNumber: 1,
            title: 'User Authentication & Role-Based Access Control',
            description: 'The system must support JWT authentication with student, team lead, and faculty roles.',
            type: RequirementType.FUNCTIONAL,
            priority: RequirementPriority.HIGH,
            status: RequirementStatus.APPROVED,
            reviewFeedback: 'Initial SRS section approved.',
          },
        ],
      },
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      title: 'Agile Backlog & Sprint Planning Module',
      description: 'Team leads must be able to manage user story backlogs, plan sprints, and order items.',
      type: RequirementType.FUNCTIONAL,
      priority: RequirementPriority.HIGH,
      status: RequirementStatus.APPROVED,
      projectId: project.id,
      versions: {
        create: [
          {
            versionNumber: 1,
            title: 'Agile Backlog & Sprint Planning Module',
            description: 'Team leads must be able to manage user story backlogs, plan sprints, and order items.',
            type: RequirementType.FUNCTIONAL,
            priority: RequirementPriority.HIGH,
            status: RequirementStatus.APPROVED,
          },
        ],
      },
    },
  });

  const req3 = await prisma.requirement.create({
    data: {
      title: 'Real-time System Notifications & Activity Feed',
      description: 'Users receive instant notifications on assignment, review status changes, and milestones.',
      type: RequirementType.NON_FUNCTIONAL,
      priority: RequirementPriority.MEDIUM,
      status: RequirementStatus.IN_REVIEW,
      projectId: project.id,
      versions: {
        create: [
          {
            versionNumber: 1,
            title: 'Real-time System Notifications & Activity Feed',
            description: 'Users receive instant notifications on assignment, review status changes, and milestones.',
            type: RequirementType.NON_FUNCTIONAL,
            priority: RequirementPriority.MEDIUM,
            status: RequirementStatus.IN_REVIEW,
          },
        ],
      },
    },
  });

  console.log('📜 Created Requirements and Requirement Versions.');

  // 5. Create Sprints
  const now = new Date();
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const sprint1 = await prisma.sprint.create({
    data: {
      name: 'Sprint 1 - Foundation & Auth',
      startDate: pastWeek,
      endDate: now,
      status: SprintStatus.COMPLETED,
      projectId: project.id,
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      name: 'Sprint 2 - Agile Tools & Deliverables',
      startDate: now,
      endDate: nextWeek,
      status: SprintStatus.ACTIVE,
      projectId: project.id,
    },
  });

  const sprint3 = await prisma.sprint.create({
    data: {
      name: 'Sprint 3 - GitHub & Final Presentation',
      startDate: nextWeek,
      endDate: inTwoWeeks,
      status: SprintStatus.PLANNED,
      projectId: project.id,
    },
  });

  console.log('🏃 Created 3 Sprints (Completed, Active, Planned).');

  // 6. Create User Stories & Link to Requirements
  const story1 = await prisma.userStory.create({
    data: {
      title: 'As a user, I want to register and log in securely',
      description: 'Provide email/password authentication returning signed JWT.',
      status: UserStoryStatus.COMPLETED,
      priority: UserStoryPriority.HIGH,
      storyPoints: 3,
      order: 1,
      projectId: project.id,
      sprintId: sprint1.id,
    },
  });

  const story2 = await prisma.userStory.create({
    data: {
      title: 'As a team lead, I want to organize user stories into active sprints',
      description: 'Drag and drop or assign user stories to sprints from product backlog.',
      status: UserStoryStatus.IN_PROGRESS,
      priority: UserStoryPriority.HIGH,
      storyPoints: 5,
      order: 2,
      projectId: project.id,
      sprintId: sprint2.id,
    },
  });

  const story3 = await prisma.userStory.create({
    data: {
      title: 'As a developer, I want to track bugs against tasks and user stories',
      description: 'Trace bugs to user stories and tasks with severity tags.',
      status: UserStoryStatus.TODO,
      priority: UserStoryPriority.MEDIUM,
      storyPoints: 5,
      order: 3,
      projectId: project.id,
    },
  });

  // Link Requirement <-> UserStory
  await prisma.requirementUserStory.createMany({
    data: [
      { requirementId: req1.id, userStoryId: story1.id },
      { requirementId: req2.id, userStoryId: story2.id },
      { requirementId: req2.id, userStoryId: story3.id },
    ],
  });

  console.log('📖 Created User Stories and Requirement Traceability links.');

  // 7. Create Tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Implement JWT Auth Controller & Middleware',
      description: 'Secure /api endpoints with authentication middleware.',
      status: TaskStatus.DONE,
      userStoryId: story1.id,
      assigneeId: member1.id,
      sprintId: sprint1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Build Product Backlog Reorder Endpoint',
      description: 'Support array ordering of stories in product backlog.',
      status: TaskStatus.IN_PROGRESS,
      userStoryId: story2.id,
      assigneeId: member2.id,
      sprintId: sprint2.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Create Deliverables & Milestone Management APIs',
      description: 'Support milestone creation and deliverable state machine.',
      status: TaskStatus.TODO,
      userStoryId: story2.id,
      assigneeId: lead.id,
      sprintId: sprint2.id,
    },
  });

  console.log('✅ Created Tasks linked to Stories, Assignees, and Sprints.');

  // 8. Create Milestones
  const milestone1 = await prisma.milestone.create({
    data: {
      title: 'Milestone 1: SRS & System Architecture Specification',
      description: 'Approval of full software requirements specification document.',
      dueDate: pastWeek,
      status: MilestoneStatus.COMPLETED,
      projectId: project.id,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      title: 'Milestone 2: Core Platform Beta Implementation',
      description: 'Working implementation of Agile tracking, sprints, and deliverable workflow.',
      dueDate: nextWeek,
      status: MilestoneStatus.IN_PROGRESS,
      projectId: project.id,
    },
  });

  const milestone3 = await prisma.milestone.create({
    data: {
      title: 'Milestone 3: Final System Defense & Evaluation',
      description: 'Final evaluation, faculty review, and project defense.',
      dueDate: inTwoWeeks,
      status: MilestoneStatus.UPCOMING,
      projectId: project.id,
    },
  });

  console.log('🚩 Created Milestones.');

  // 9. Create Deliverables
  const deliverable1 = await prisma.deliverable.create({
    data: {
      title: 'Software Requirements Specification (SRS) Document',
      description: 'Comprehensive SRS document including functional and non-functional requirements.',
      type: DeliverableType.SRS_DOCUMENT,
      status: DeliverableStatus.APPROVED,
      fileUrl: 'https://example.com/files/srs_v1.pdf',
      dueDate: pastWeek,
      reviewFeedback: 'Excellent work. Architecture and requirements are clearly defined.',
      milestoneId: milestone1.id,
      projectId: project.id,
    },
  });

  const deliverable2 = await prisma.deliverable.create({
    data: {
      title: 'System Architecture & Database Design',
      description: 'Detailed ER diagram, Prisma schema definition, and REST API specification.',
      type: DeliverableType.DESIGN_DOCUMENT,
      status: DeliverableStatus.SUBMITTED,
      fileUrl: 'https://example.com/files/architecture.pdf',
      dueDate: nextWeek,
      milestoneId: milestone2.id,
      projectId: project.id,
    },
  });

  const deliverable3 = await prisma.deliverable.create({
    data: {
      title: 'Sprint 2 Midterm Progress Report',
      description: 'Midterm summary of sprint progress, velocity, and burn-down metrics.',
      type: DeliverableType.REPORT,
      status: DeliverableStatus.DRAFT,
      dueDate: nextWeek,
      milestoneId: milestone2.id,
      projectId: project.id,
    },
  });

  console.log('📄 Created Deliverables with status workflow.');

  // 10. Create Bugs
  const bug1 = await prisma.bug.create({
    data: {
      title: 'Token expiration handler throws 500 instead of 401 envelope',
      description: 'Expired JWT tokens cause uncaught exception in middleware.',
      priority: BugPriority.HIGH,
      severity: BugSeverity.HIGH,
      status: BugStatus.RESOLVED,
      projectId: project.id,
      requirementId: req1.id,
      userStoryId: story1.id,
      taskId: task1.id,
      sprintId: sprint1.id,
      reporterId: member1.id,
      assigneeId: lead.id,
      pullRequestUrl: 'https://github.com/nikshrma/capstone-hub/pull/12',
      prNumber: 12,
    },
  });

  const bug2 = await prisma.bug.create({
    data: {
      title: 'Backlog reorder index collision under concurrent updates',
      description: 'Simultaneous story reorders result in identical order values.',
      priority: BugPriority.MEDIUM,
      severity: BugSeverity.MEDIUM,
      status: BugStatus.OPEN,
      projectId: project.id,
      requirementId: req2.id,
      userStoryId: story2.id,
      taskId: task2.id,
      sprintId: sprint2.id,
      reporterId: member2.id,
      assigneeId: member1.id,
    },
  });

  console.log('🐛 Created Bugs with traceability links.');

  // 11. Create GitHub Connection
  await prisma.gitHubConnection.create({
    data: {
      projectId: project.id,
      repoOwner: 'nikshrma',
      repoName: 'capstone-hub',
      repoUrl: 'https://github.com/nikshrma/capstone-hub',
      defaultBranch: 'main',
    },
  });

  console.log('🐙 Created GitHub Connection.');

  // 12. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        action: 'PROJECT_CREATED',
        entityType: 'Project',
        entityId: project.id,
        details: 'Project "CapstoneHub Management System" was created.',
        actorId: lead.id,
        projectId: project.id,
      },
      {
        action: 'DELIVERABLE_SUBMITTED',
        entityType: 'Deliverable',
        entityId: deliverable2.id,
        details: 'Deliverable "System Architecture & Database Design" was submitted for review.',
        actorId: lead.id,
        projectId: project.id,
      },
      {
        action: 'DELIVERABLE_APPROVED',
        entityType: 'Deliverable',
        entityId: deliverable1.id,
        details: 'Deliverable "Software Requirements Specification (SRS) Document" was approved by faculty.',
        actorId: faculty.id,
        projectId: project.id,
      },
    ],
  });

  console.log('📜 Created Activity Logs.');

  // 13. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'New Deliverable Submitted',
        message: 'Alice Smith submitted "System Architecture & Database Design" for review.',
        type: NotificationType.REVIEW,
        entityType: 'Deliverable',
        entityId: deliverable2.id,
        projectId: project.id,
        userId: faculty.id,
        read: false,
      },
      {
        title: 'Deliverable Approved',
        message: 'Dr. Alan Turing approved "Software Requirements Specification (SRS) Document".',
        type: NotificationType.REVIEW,
        entityType: 'Deliverable',
        entityId: deliverable1.id,
        projectId: project.id,
        userId: lead.id,
        read: true,
        readAt: new Date(),
      },
      {
        title: 'Task Assigned',
        message: 'You have been assigned to task "Build Product Backlog Reorder Endpoint".',
        type: NotificationType.ASSIGNMENT,
        entityType: 'Task',
        entityId: task2.id,
        projectId: project.id,
        userId: member2.id,
        read: false,
      },
    ],
  });

  console.log('🔔 Created Notifications.');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\nDemo User Credentials:');
  console.log('----------------------------------------------------');
  console.log('Faculty:          faculty@example.com / Password123!');
  console.log('Team Lead:        lead@example.com    / Password123!');
  console.log('Team Member 1:    bob@example.com     / Password123!');
  console.log('Team Member 2:    charlie@example.com / Password123!');
  console.log('Unassigned User:  dave@example.com    / Password123!');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
