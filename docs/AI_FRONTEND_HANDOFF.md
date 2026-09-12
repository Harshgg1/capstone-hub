# AI Frontend Handoff Guide — CapstoneHub

> **Source of Truth Document for AI Agents (Manus / Cursor / Copilot)**  
> This master handoff document summarizes the completed backend, architecture, database schemas, authorization mechanisms, API behavior, and recommended frontend structure for **CapstoneHub**.

---

## 1. Project Purpose

**CapstoneHub** is a software engineering project management and lifecycle platform tailored for academic capstone projects. It unifies activities traditionally scattered across disconnected tools (Google Docs, Trello, GitHub, messaging apps, and evaluation spreadsheets):
- **SRS & Requirement Management** (Functional/Non-Functional requirements with versioning and faculty approval workflow).
- **Agile Lifecycle Management** (User stories, product backlog ordering, sprint planning, and task tracking).
- **Milestones & Deliverables** (Milestone tracking, deliverable state machine with faculty review feedback).
- **Bug & Defect Traceability** (Bug tracking linked to requirements, user stories, tasks, and GitHub PRs).
- **GitHub Integration** (Read-only repository connection, commits, branches, PRs, contributors, and activity feeds).
- **End-to-End Traceability Matrix** (Requirement → User Story → Task → Sprint → Bug → GitHub PR).
- **Faculty Monitoring & Evaluation** (Aggregated dashboards, progress calculation, and deliverable grading/feedback).
- **Activity & Notification Systems** (In-app notifications and audit logs).

---

## 2. Current System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Frontend)                         │
│                    React 18 + TypeScript + Vite                        │
│                   Tailwind CSS + Lucide Icons                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JWT Auth)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Application Layer (Backend)                      │
│                  Node.js + Express + TypeScript                        │
│               Port: 5001 | Base URL: http://localhost:5001/api         │
├───────────────┬───────────────┬───────────────┬────────────────────────┤
│ Auth & RBAC   │ Projects/Teams│ Requirements  │ Sprints & Backlog      │
│ Deliverables  │ Bugs & Trace  │ Notifications │ GitHub Proxy           │
└───────────────┴───────┬───────┴───────────────┴────────────────────────┘
                        │ Prisma ORM (v6.19.3)
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Database Layer                                │
│                   PostgreSQL 17 Alpine Container                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Stack Components:
- **Language**: TypeScript 5.7+ (Node.js backend, React 18 frontend)
- **Backend Framework**: Express v4.21.2
- **Database & ORM**: PostgreSQL 17 Alpine via Prisma ORM v6.19.3
- **Authentication**: JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- **Testing**: Vitest + Supertest (370 passing tests covering all routes and edge cases)

---

## 3. How to Run Locally

### Prerequisites
- Node.js (v18+ or v20+)
- Docker & Docker Compose

### Step-by-Step Setup
1. **Start PostgreSQL Container**:
   ```bash
   docker compose up -d
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Database Migrations & Seed**:
   ```bash
   npm run db:migrate --workspace=backend
   npm run db:seed
   ```
4. **Start Backend Dev Server**:
   ```bash
   npm run dev:backend
   # Server listening on http://localhost:5001 (API mounted at /api)
   ```
5. **Run Test Suite**:
   ```bash
   npm test
   ```

---

## 4. Authentication Architecture & Session Handling

- **Mechanism**: Bearer Token Authentication via standard `Authorization: Bearer <token>` header.
- **Token Payload**:
  ```json
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "TEAM_MEMBER" | "TEAM_LEAD" | "FACULTY"
  }
  ```
- **Login Endpoint**: `POST /api/auth/login` returning `{ success: true, data: { user, token } }`.
- **Registration Endpoint**: `POST /api/auth/register` returning `{ success: true, data: { user, token } }`.
- **Token Expiration**: Default 7 days (`JWT_EXPIRES_IN=7d`).
- **Frontend Storage Expectation**: Store the JWT string in `localStorage` or `sessionStorage` and include it in every HTTP request.

---

## 5. User Roles & RBAC Rules

1. **`FACULTY`**:
   - Primary advisor/evaluator across assigned projects.
   - Can approve/reject Requirements (`APPROVED`, `REJECTED`).
   - Can start review, approve, or request revisions on Deliverables (`UNDER_REVIEW`, `APPROVED`, `REVISION_REQUESTED`).
   - Accesses Faculty Dashboard (`/api/faculty/dashboard`), Overseen Projects, and Progress analytics.
   - Has full manager administrative rights on projects they advise.
2. **`TEAM_LEAD`**:
   - Student project manager / lead.
   - Full management rights on project team, sprint planning, backlog reordering, task assignments, bug assignments.
   - Can submit requirements and deliverables for faculty review.
   - Can close and reopen bugs.
3. **`TEAM_MEMBER`** (`STUDENT`):
   - Project team contributor.
   - Can create requirements, user stories, tasks, bugs, deliverables.
   - Can update tasks assigned to them or bugs reported/assigned to them.
   - Cannot manage team membership, assign sprints, or reorder backlog items.

---

## 6. Major Application Modules & API Surface

| Module | Route Prefix | Main Features |
|---|---|---|
| **Auth** | `/api/auth` | Register (`TEAM_MEMBER`, `FACULTY`), Login |
| **Projects & Teams** | `/api/projects` | Project CRUD, Board, Team Members & Roles |
| **Requirements** | `/api/requirements`, `/api/projects/:id/requirements` | SRS Requirement CRUD, Versions, Submit, Review, Approve, Reject, Link Stories |
| **User Stories** | `/api/stories`, `/api/projects/:id/stories` | User Story CRUD, Link Requirements, Link Tasks |
| **Product Backlog** | `/api/backlog`, `/api/projects/:id/backlog` | View Backlog, Add Story, Array Reorder |
| **Sprints** | `/api/sprints`, `/api/projects/:id/sprints` | Sprint CRUD, Assign Stories/Tasks, Sprint Board |
| **Tasks** | `/api/tasks` | Task CRUD, Link Story, Link Sprint |
| **Milestones & Deliverables** | `/api/milestones`, `/api/deliverables` | Milestone CRUD, Deliverable CRUD, Submit for Review, Faculty Review |
| **Bugs & Defects** | `/api/bugs`, `/api/projects/:id/bugs` | Bug CRUD, Assignment, Status Workflow, Reopen/Close, Traceability Link |
| **Traceability** | `/api/traceability` | Matrix calculation, Requirement/Story/Task trace trees |
| **Faculty Dashboard** | `/api/faculty` | Aggregated Monitoring Dashboard, Overseen Projects, Progress Metrics |
| **GitHub Integration** | `/api/github` | Repository connection, Proxy for Commits, Branches, PRs, Contributors |
| **Notifications** | `/api/notifications` | User notifications, Unread count, Mark as read/unread |
| **Activity Log** | `/api/projects/:id/activity` | Project audit feed |

---

## 7. Database & Domain Data Model

Key entities defined in Prisma (`backend/prisma/schema.prisma`):
- **User**: `id`, `name`, `email`, `password`, `role` (`TEAM_MEMBER`, `TEAM_LEAD`, `FACULTY`).
- **Team** & **TeamMember**: Team composition linking users to projects with roles.
- **Project**: Central domain entity containing milestones, requirements, user stories, sprints, bugs, deliverables, and GitHub connection.
- **Requirement** & **RequirementVersion**: Requirements with SRS type (`FUNCTIONAL`, `NON_FUNCTIONAL`), status (`DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `COMPLETED`), and historical versions.
- **UserStory**: Agile user story with `storyPoints`, `priority`, `status`, `order`, linked to requirements and sprints.
- **Sprint**: Sprint container with `startDate`, `endDate`, `status` (`PLANNED`, `ACTIVE`, `COMPLETED`).
- **Task**: Task item (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`) linked to user story, sprint, and assignee.
- **Milestone**: Project milestone container (`UPCOMING`, `IN_PROGRESS`, `COMPLETED`).
- **Deliverable**: File/document submission (`SRS_DOCUMENT`, `DESIGN_DOCUMENT`, `REPORT`, `PRESENTATION`, `OTHER`) with state machine (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REVISION_REQUESTED`).
- **Bug**: Defect item (`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`) with severity, priority, reporter, assignee, linked requirement, story, task, sprint, and GitHub PR URL/number.
- **GitHubConnection**: Repository mapping (`repoOwner`, `repoName`, `defaultBranch`).
- **ActivityLog** & **Notification**: Audit logs and notification items.

---

## 8. Recommended Frontend Navigation & Screen Map

```
/ (Root)
 ├── /login
 ├── /register
 └── /dashboard (Role-based redirect)
      ├── Student / Team Lead Layout
      │    ├── /projects (List & Project Cards)
      │    ├── /projects/:projectId
      │    │    ├── Overview / Board
      │    │    ├── Requirements (/requirements)
      │    │    ├── Product Backlog (/backlog)
      │    │    ├── Sprint Planning & Active Board (/sprints)
      │    │    ├── Tasks (/tasks)
      │    │    ├── Milestones & Deliverables (/deliverables)
      │    │    ├── Bugs & Defect Tracker (/bugs)
      │    │    ├── Traceability Matrix (/traceability)
      │    │    ├── Team Management (/team)
      │    │    └── GitHub Insights (/github)
      │    └── /notifications
      │
      └── Faculty Layout
           ├── /faculty/dashboard (Aggregated Monitoring Overview)
           ├── /faculty/projects (Overseen Projects)
           ├── /faculty/projects/:projectId (Deep-dive Project Overview)
           └── /faculty/reviews (Pending Deliverables & Requirements Review Queue)
```

---

## 9. Important Implementation Details & Backend Quirks for Manus

1. **Dual Route Aliases**:
   Many endpoints support both pluralized and singular route aliases for developer convenience:
   - `/api/stories` AND `/api/user-stories`
   - `/api/backlog/:projectId` AND `/api/product-backlog/:projectId`
   - `/api/projects/:id/github/pulls` AND `/api/projects/:id/github/pull-requests` AND `/api/projects/:id/github/prs`
   - `/api/notifications/unread-count` AND `/api/notifications/unread/count`
2. **Response Structure Consistency**:
   - Successful reads/writes return `{ success: true, message?: string, data: ... }`.
   - Structured error responses return `{ success: false, error: string }` with appropriate HTTP status code (400, 401, 403, 404, 409, 422, 500, 502).
3. **CORS Configuration**:
   - Configured with `credentials: true` and supports default Vite origin (`http://localhost:5173`) or comma-separated origins via `CORS_ORIGIN` env variable.
4. **State Machine Validation**:
   - Deliverable updates validate allowed status jumps (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` / `REVISION_REQUESTED`). Invalid jumps return HTTP 422.
   - Bug updates validate status transitions (`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`). Invalid jumps return HTTP 422.
5. **Faculty Authorization**:
   - Only `FACULTY` can set Requirement status to `APPROVED`/`REJECTED`.
   - Only `FACULTY` can set Deliverable status to `APPROVED`/`REVISION_REQUESTED` or execute `/api/deliverables/:id/review`.
6. **Demo Data Seed Credentials**:
   - Faculty: `faculty@example.com` / `Password123!`
   - Team Lead: `lead@example.com` / `Password123!`
   - Team Member: `bob@example.com` / `Password123!`
   - Team Member 2: `charlie@example.com` / `Password123!`
