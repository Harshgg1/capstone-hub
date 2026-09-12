# Data Model Documentation — CapstoneHub Frontend Specification

This document details the Prisma entities, fields, data types, relationships, and TypeScript interfaces used by the backend API.

---

## Entity Relationship Diagram (Conceptual)

```
User (1) ───< TeamMember (N) ───> Team (1) ─── (1) Project (1) ───> Requirement (N) ───> Version (N)
  │                                                      │                │
  │ (Reporter/Assignee)                                  ├───────────> UserStory (N) <─── (N-M Link)
  │                                                      │                │
  ├───> Task (N) <───────────────────────────────────────┼────────────────┼───> Task (N)
  │                                                      │                │
  ├───> Bug (N) <────────────────────────────────────────┼────────────────┴───> Bug (N)
  │                                                      │
  └───> Notification (N)                                 ├───> Sprint (N)
                                                         ├───> Milestone (N) ───> Deliverable (N)
                                                         ├───> GitHubConnection (1)
                                                         └───> ActivityLog (N)
```

---

## Core Entities & TypeScript Models

### 1. User (`users`)
Represent any user account in the system.

```typescript
export enum Role {
  TEAM_MEMBER = 'TEAM_MEMBER',
  TEAM_LEAD = 'TEAM_LEAD',
  FACULTY = 'FACULTY'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
```

---

### 2. Team & TeamMember (`teams`, `team_members`)
Represents project student teams.

```typescript
export interface Team {
  id: string;
  name: string;
  leadId?: string | null;
  lead?: User | null;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user: User;
  role: Role;
  joinedAt: string;
}
```

---

### 3. Project (`projects`)
Central container entity for an academic software engineering capstone project.

```typescript
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  facultyId?: string | null;
  faculty?: User | null;
  teamId?: string | null;
  team?: Team | null;
  milestones?: Milestone[];
  requirements?: Requirement[];
  userStories?: UserStory[];
  sprints?: Sprint[];
  bugs?: Bug[];
  deliverables?: Deliverable[];
  githubConnection?: GitHubConnection | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 4. Requirement & RequirementVersion (`requirements`, `requirement_versions`)
Manages SRS Functional & Non-Functional Requirements.

```typescript
export enum RequirementType {
  FUNCTIONAL = 'FUNCTIONAL',
  NON_FUNCTIONAL = 'NON_FUNCTIONAL'
}

export enum RequirementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum RequirementStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  projectId: string;
  versions?: RequirementVersion[];
  userStories?: RequirementUserStory[];
  createdAt: string;
  updatedAt: string;
}

export interface RequirementVersion {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  reviewFeedback?: string | null;
  requirementId: string;
  createdAt: string;
}
```

---

### 5. UserStory (`user_stories`)
Agile User Story items managed in product backlogs and active sprints.

```typescript
export enum UserStoryPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum UserStoryStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface UserStory {
  id: string;
  title: string;
  description?: string | null;
  status: UserStoryStatus;
  priority: UserStoryPriority;
  storyPoints?: number | null;
  order: number;
  projectId: string;
  sprintId?: string | null;
  tasks?: Task[];
  requirements?: RequirementUserStory[];
  createdAt: string;
  updatedAt: string;
}
```

---

### 6. Sprint (`sprints`)
Agile Sprint cycles.

```typescript
export enum SprintStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED'
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  projectId: string;
  userStories?: UserStory[];
  tasks?: Task[];
  bugs?: Bug[];
  createdAt: string;
  updatedAt: string;
}
```

---

### 7. Task (`tasks`)
Individual work items belonging to User Stories and assigned to Team Members.

```typescript
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE'
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  userStoryId: string;
  assigneeId?: string | null;
  assignee?: User | null;
  sprintId?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 8. Milestone & Deliverable (`milestones`, `deliverables`)
Academic deadlines and submission artifacts.

```typescript
export enum MilestoneStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: MilestoneStatus;
  projectId: string;
  deliverables?: Deliverable[];
  createdAt: string;
  updatedAt: string;
}

export enum DeliverableType {
  SRS_DOCUMENT = 'SRS_DOCUMENT',
  DESIGN_DOCUMENT = 'DESIGN_DOCUMENT',
  REPORT = 'REPORT',
  PRESENTATION = 'PRESENTATION',
  OTHER = 'OTHER'
}

export enum DeliverableStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REVISION_REQUESTED = 'REVISION_REQUESTED'
}

export interface Deliverable {
  id: string;
  title: string;
  description?: string | null;
  type: DeliverableType;
  status: DeliverableStatus;
  fileUrl?: string | null;
  dueDate?: string | null;
  reviewFeedback?: string | null;
  milestoneId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### 9. Bug (`bugs`)
Defect tracking entity with multi-level traceability links.

```typescript
export enum BugPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BugSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum BugStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export interface Bug {
  id: string;
  title: string;
  description?: string | null;
  priority: BugPriority;
  severity: BugSeverity;
  status: BugStatus;
  projectId: string;
  requirementId?: string | null;
  userStoryId?: string | null;
  taskId?: string | null;
  sprintId?: string | null;
  pullRequestUrl?: string | null;
  prNumber?: number | null;
  reporterId: string;
  reporter?: User;
  assigneeId?: string | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}
```

---

### 10. GitHubConnection (`github_connections`)

```typescript
export interface GitHubConnection {
  id: string;
  projectId: string;
  repoOwner: string;
  repoName: string;
  repoUrl?: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}
```
