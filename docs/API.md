# API Endpoint Documentation — CapstoneHub Backend

> Base API URL: `http://localhost:5001/api`  
> All endpoints (except `/health`, `/auth/register`, `/auth/login`) require `Authorization: Bearer <JWT_TOKEN>` header.

---

## Table of Contents
1. [Health & System](#1-health--system)
2. [Authentication](#2-authentication)
3. [Projects & Teams](#3-projects--teams)
4. [Requirements & SRS](#4-requirements--srs)
5. [User Stories & Requirements Traceability](#5-user-stories--requirements-traceability)
6. [Product Backlog](#6-product-backlog)
7. [Sprints](#7-sprints)
8. [Tasks](#8-tasks)
9. [Milestones & Deliverables](#9-milestones--deliverables)
10. [Bugs & Defects](#10-bugs--defects)
11. [Traceability Matrix & Graph](#11-traceability-matrix--graph)
12. [Faculty Monitoring Dashboard](#12-faculty-monitoring-dashboard)
13. [GitHub Integration](#13-github-integration)
14. [Notifications](#14-notifications)
15. [Activity Logs](#15-activity-logs)

---

## 1. Health & System

### `GET /api/health`
- **Auth Required**: No
- **Allowed Roles**: Public
- **Success Response (200)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-12T20:00:00.000Z",
    "environment": "development"
  }
  ```

---

## 2. Authentication

### `POST /api/auth/register`
- **Auth Required**: No
- **Allowed Roles**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Jane Doe",
    "role": "TEAM_MEMBER" // Optional: "TEAM_MEMBER" (default) or "FACULTY"
  }
  ```
- **Validation**: Email format required, password min length 6, name required, role must be `TEAM_MEMBER` or `FACULTY`.
- **Success Response (201)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "name": "Jane Doe", "role": "TEAM_MEMBER", "createdAt": "..." },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses**: 400 Bad Request, 409 Conflict (email exists).

### `POST /api/auth/login`
- **Auth Required**: No
- **Allowed Roles**: Public
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "name": "Jane Doe", "role": "TEAM_MEMBER" },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Error Responses**: 400 Bad Request, 401 Unauthorized (invalid credentials).

---

## 3. Projects & Teams

### `POST /api/projects`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_MEMBER`, `TEAM_LEAD`, `FACULTY` (User creating project automatically becomes `TEAM_LEAD` of project's team unless `FACULTY`)
- **Request Body**:
  ```json
  {
    "name": "Project Name",
    "description": "Project Description",
    "facultyId": "faculty-uuid" // Optional
  }
  ```
- **Success Response (201)**: `{ "success": true, "data": { "id": "uuid", "name": "Project Name", "team": { ... } } }`

### `GET /api/projects`
- **Auth Required**: Yes
- **Allowed Roles**: All authenticated users
- **Query Parameters**: `role` (optional)
- **Success Response (200)**: List of projects user participates in (or all projects if Faculty).

### `GET /api/projects/:id`
- **Auth Required**: Yes
- **Allowed Roles**: Project team members, assigned faculty, or faculty admins.
- **Success Response (200)**: Project details with team, milestones, requirements summary.

### `PUT /api/projects/:id` (or `PATCH`)
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD` of project team, assigned `FACULTY`.
- **Request Body**: `{ "name": "Updated", "description": "Updated", "facultyId": "..." }`

### `GET /api/projects/:id/members`
- **Auth Required**: Yes
- **Success Response (200)**: Team composition and member list.

### `POST /api/projects/:id/members`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**: `{ "email": "member@example.com", "role": "TEAM_MEMBER" }`

### `DELETE /api/projects/:id/members/:userId`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`

---

## 4. Requirements & SRS

### `POST /api/projects/:projectId/requirements`
- **Auth Required**: Yes
- **Allowed Roles**: Project team members, `TEAM_LEAD`, `FACULTY`
- **Request Body**:
  ```json
  {
    "title": "Requirement Title",
    "description": "Requirement Description",
    "type": "FUNCTIONAL", // "FUNCTIONAL" | "NON_FUNCTIONAL"
    "priority": "HIGH" // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  }
  ```

### `GET /api/projects/:projectId/requirements`
- **Auth Required**: Yes
- **Success Response (200)**: List of requirements for project.

### `GET /api/requirements/:id`
- **Auth Required**: Yes
- **Success Response (200)**: Requirement details including version history and linked user stories.

### `PUT /api/requirements/:id` (or `PATCH`)
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`, or author.
- **Note**: Modifying description/title increments the RequirementVersion number automatically.

### `POST /api/requirements/:id/submit`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Behavior**: Transitions status `DRAFT` → `IN_REVIEW`.

### `POST /api/requirements/:id/review` (or `/approve`, `/reject`)
- **Auth Required**: Yes
- **Allowed Roles**: `FACULTY` only.
- **Request Body**: `{ "action": "APPROVE" | "REJECT", "reviewFeedback": "Comments..." }`
- **Behavior**: Transitions status `IN_REVIEW` → `APPROVED` or `REJECTED`.

---

## 5. User Stories & Requirements Traceability

### `POST /api/projects/:projectId/stories` (Alias: `/user-stories`)
- **Auth Required**: Yes
- **Allowed Roles**: Project team members
- **Request Body**:
  ```json
  {
    "title": "User Story Title",
    "description": "As a user...",
    "priority": "HIGH",
    "storyPoints": 5,
    "requirementIds": ["req-uuid-1"]
  }
  ```

### `GET /api/projects/:projectId/stories`
- **Auth Required**: Yes
- **Success Response (200)**: List of user stories.

### `POST /api/requirements/:requirementId/stories/:storyId`
- **Auth Required**: Yes
- **Allowed Roles**: Project team members
- **Behavior**: Links Requirement to User Story in `requirement_user_stories`.

### `DELETE /api/requirements/:requirementId/stories/:storyId`
- **Auth Required**: Yes
- **Behavior**: Unlinks Requirement from User Story.

---

## 6. Product Backlog

### `GET /api/backlog/:projectId` (Alias: `/api/product-backlog/:projectId`)
- **Auth Required**: Yes
- **Success Response (200)**: List of user stories in backlog ordered by `order` field ascending.

### `POST /api/backlog/:projectId/stories`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**: `{ "title": "New Story", "description": "...", "storyPoints": 3 }`

### `PUT /api/backlog/:projectId/reorder` (or `PATCH`)
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**:
  ```json
  {
    "storyIds": ["story-uuid-3", "story-uuid-1", "story-uuid-2"]
  }
  ```
- **Behavior**: Updates `order` sequence integer for each provided story ID.

---

## 7. Sprints

### `POST /api/projects/:projectId/sprints`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**:
  ```json
  {
    "name": "Sprint 1",
    "startDate": "2026-09-01T00:00:00Z",
    "endDate": "2026-09-14T00:00:00Z"
  }
  ```

### `GET /api/projects/:projectId/sprints`
- **Auth Required**: Yes
- **Success Response (200)**: List of project sprints with linked tasks and stories.

### `GET /api/sprints/:id`
- **Auth Required**: Yes

### `PUT /api/sprints/:id` (or `PATCH`)
- **Auth Required**: Yes
- **Request Body**: `{ "name": "...", "status": "ACTIVE" }` // `PLANNED` | `ACTIVE` | `COMPLETED`

### `POST /api/sprints/:id/stories`
- **Auth Required**: Yes
- **Request Body**: `{ "storyIds": ["story-1", "story-2"] }`

### `GET /api/sprints/:id/board`
- **Auth Required**: Yes
- **Success Response (200)**: Sprint board containing stories and tasks grouped by status (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`).

---

## 8. Tasks

### `POST /api/stories/:storyId/tasks`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "Task Title",
    "description": "Task description",
    "assigneeId": "user-uuid" // Optional (must be project team member)
  }
  ```

### `GET /api/tasks/:id`
- **Auth Required**: Yes

### `PUT /api/tasks/:id` (or `PATCH`)
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "status": "IN_PROGRESS", // "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE"
    "assigneeId": "user-uuid"
  }
  ```

---

## 9. Milestones & Deliverables

### `POST /api/projects/:projectId/milestones`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**: `{ "title": "Milestone 1", "description": "...", "dueDate": "..." }`

### `GET /api/projects/:projectId/milestones`
- **Auth Required**: Yes

### `POST /api/milestones/:milestoneId/deliverables`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`, `TEAM_MEMBER`
- **Request Body**:
  ```json
  {
    "title": "SRS Document",
    "description": "Full SRS specification",
    "type": "SRS_DOCUMENT", // "SRS_DOCUMENT" | "DESIGN_DOCUMENT" | "REPORT" | "PRESENTATION" | "OTHER"
    "fileUrl": "https://example.com/srs.pdf",
    "dueDate": "2026-09-30T00:00:00Z"
  }
  ```

### `GET /api/deliverables/:id`
- **Auth Required**: Yes

### `POST /api/deliverables/:id/submit`
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Behavior**: Transitions status `DRAFT` / `REVISION_REQUESTED` → `SUBMITTED`.

### `POST /api/deliverables/:id/review`
- **Auth Required**: Yes
- **Allowed Roles**: `FACULTY` only
- **Request Body**:
  ```json
  {
    "action": "START_REVIEW" | "APPROVE" | "REQUEST_REVISION",
    "feedback": "Comments..." // Mandatory for REQUEST_REVISION
  }
  ```
- **Behavior**: Transitions status to `UNDER_REVIEW`, `APPROVED`, or `REVISION_REQUESTED`.

---

## 10. Bugs & Defects

### `POST /api/projects/:projectId/bugs`
- **Auth Required**: Yes
- **Allowed Roles**: Project team members, `FACULTY`
- **Request Body**:
  ```json
  {
    "title": "Bug Title",
    "description": "Defect details",
    "priority": "HIGH", // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    "severity": "HIGH", // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    "requirementId": "req-uuid", // Optional
    "userStoryId": "story-uuid", // Optional
    "taskId": "task-uuid", // Optional
    "sprintId": "sprint-uuid", // Optional
    "pullRequestUrl": "https://github.com/...", // Optional
    "prNumber": 12 // Optional
  }
  ```

### `GET /api/projects/:projectId/bugs`
- **Auth Required**: Yes

### `PUT /api/bugs/:id` (or `PATCH`)
- **Auth Required**: Yes
- **Allowed Roles**:
  - `assigneeId` updates: `TEAM_LEAD` or `FACULTY` only (assignee must be team member).
  - Status updates (`OPEN` → `IN_PROGRESS` → `RESOLVED`): Assignee, Reporter, `TEAM_LEAD`, `FACULTY`.
  - Reopen / Close (`RESOLVED` → `CLOSED`, or `CLOSED`/`RESOLVED` → `OPEN`): Reporter, `TEAM_LEAD`, `FACULTY` only.

---

## 11. Traceability Matrix & Graph

### `GET /api/traceability/project/:projectId` (Alias: `/api/projects/:projectId/traceability`)
- **Auth Required**: Yes
- **Success Response (200)**: Full hierarchical trace object linking Requirements → User Stories → Tasks → Sprints → Bugs → GitHub Pull Requests.

### `GET /api/traceability/project/:projectId/matrix`
- **Auth Required**: Yes
- **Success Response (200)**: Structured 2D matrix formatted for frontend grid display.

---

## 12. Faculty Monitoring Dashboard

### `GET /api/faculty/dashboard`
- **Auth Required**: Yes
- **Allowed Roles**: `FACULTY` only
- **Success Response (200)**: Comprehensive dashboard metrics across all overseen projects (milestone progress, pending requirement reviews, pending deliverable reviews, active sprint status).

### `GET /api/faculty/projects/:projectId/progress`
- **Auth Required**: Yes
- **Allowed Roles**: `FACULTY` only
- **Success Response (200)**: Detailed milestone, task completion percentage, requirement coverage, and sprint velocity for project.

---

## 13. GitHub Integration

### `POST /api/github/connect` (Alias: `/api/projects/:projectId/github/connect`)
- **Auth Required**: Yes
- **Allowed Roles**: `TEAM_LEAD`, `FACULTY`
- **Request Body**: `{ "projectId": "uuid", "repoOwner": "owner", "repoName": "repo", "defaultBranch": "main" }`

### `GET /api/projects/:projectId/github/commits`
- **Auth Required**: Yes
- **Success Response (200)**: List of repository commits fetched from GitHub REST API.

### `GET /api/projects/:projectId/github/pulls` (Alias: `/pull-requests`, `/prs`)
- **Auth Required**: Yes
- **Success Response (200)**: List of repository pull requests fetched from GitHub REST API.

---

## 14. Notifications

### `GET /api/notifications`
- **Auth Required**: Yes
- **Success Response (200)**: List of user notifications.

### `GET /api/notifications/unread-count`
- **Auth Required**: Yes
- **Success Response (200)**: `{ "success": true, "data": { "unreadCount": 3 } }`

### `POST /api/notifications/mark-all-read`
- **Auth Required**: Yes
- **Success Response (200)**: `{ "success": true, "message": "All notifications marked as read" }`

---

## 15. Activity Logs

### `GET /api/projects/:projectId/activity`
- **Auth Required**: Yes
- **Success Response (200)**: Paginated audit log feed for project.
