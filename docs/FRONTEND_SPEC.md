# Frontend Screen Specifications & Layout Map — CapstoneHub

This document maps every implemented backend domain to its corresponding recommended React frontend screen, detailing routes, target roles, required API endpoints, user actions, states, and screen navigation relationships.

---

## 1. Authentication Screens

### A. Login Screen
- **Route**: `/login`
- **Intended Roles**: All Users (Unauthenticated)
- **API Endpoints**: `POST /api/auth/login`
- **Actions**: Enter credentials, Submit Login, Link to Registration.
- **States**: Loading spinner, Invalid credentials error message.
- **Relationships**: On success, store JWT token and user info, then redirect to `/dashboard` or `/faculty/dashboard`.

### B. Registration Screen
- **Route**: `/register`
- **Intended Roles**: All Users (Unauthenticated)
- **API Endpoints**: `POST /api/auth/register`
- **Actions**: Select Role (`TEAM_MEMBER` or `FACULTY`), Fill Name, Email, Password, Submit.
- **States**: Field validation errors, Duplicate email 409 error envelope.
- **Relationships**: On success, redirect to `/dashboard` or `/faculty/dashboard`.

---

## 2. General Dashboard & Navigation

### A. Student / Team Lead Main Dashboard
- **Route**: `/dashboard`
- **Intended Roles**: `TEAM_MEMBER`, `TEAM_LEAD`
- **Data Required**: Active projects list, pending tasks assigned to user, upcoming deliverable deadlines, recent notifications.
- **API Endpoints**: `GET /api/projects`, `GET /api/notifications/unread-count`, `GET /api/notifications`
- **Actions**: Click Project Card to navigate to Project Overview, view unread notifications.

---

## 3. Project Management

### A. Projects List & Creation Modal
- **Route**: `/projects`
- **Intended Roles**: All Roles
- **API Endpoints**: `GET /api/projects`, `POST /api/projects`
- **Actions**: Search/filter projects, Create Project modal (Name, Description, Faculty Advisor dropdown).

### B. Project Overview & Detail Screen
- **Route**: `/projects/:projectId`
- **Intended Roles**: Project Members, Faculty
- **API Endpoints**: `GET /api/projects/:id`, `GET /api/projects/:id/members`, `GET /api/projects/:projectId/activity`
- **Sub-Tab Navigation**:
  - `Overview` (`/projects/:projectId`)
  - `Requirements` (`/projects/:projectId/requirements`)
  - `Product Backlog` (`/projects/:projectId/backlog`)
  - `Sprints` (`/projects/:projectId/sprints`)
  - `Board` (`/projects/:projectId/board`)
  - `Deliverables` (`/projects/:projectId/deliverables`)
  - `Bugs` (`/projects/:projectId/bugs`)
  - `Traceability` (`/projects/:projectId/traceability`)
  - `Team` (`/projects/:projectId/team`)
  - `GitHub` (`/projects/:projectId/github`)

---

## 4. Team Management Screen

- **Route**: `/projects/:projectId/team`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `GET /api/projects/:id/members`
  - `POST /api/projects/:id/members`
  - `DELETE /api/projects/:id/members/:userId`
  - `PATCH /api/projects/:id/members/:userId/role`
- **Actions**: Add team member by email, update member role (`TEAM_LEAD` / `TEAM_MEMBER`), remove member.

---

## 5. Requirements & SRS Management Screen

- **Route**: `/projects/:projectId/requirements`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **Data Required**: Requirements list, version history, link status.
- **API Endpoints**:
  - `GET /api/projects/:projectId/requirements`
  - `POST /api/projects/:projectId/requirements`
  - `GET /api/requirements/:id`
  - `GET /api/requirements/:id/versions`
  - `POST /api/requirements/:id/submit` (Team Lead)
  - `POST /api/requirements/:id/review` (Faculty)
- **Actions**: Create Requirement, Edit (creates version), View Version Drawer, Submit for Review button, Faculty Approve/Reject modal with feedback input.

---

## 6. User Stories & Product Backlog Screen

- **Route**: `/projects/:projectId/backlog` (Alias: `/product-backlog`)
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `GET /api/backlog/:projectId`
  - `POST /api/backlog/:projectId/stories`
  - `PUT /api/backlog/:projectId/reorder`
  - `POST /api/requirements/:requirementId/stories/:storyId`
- **Actions**: Drag-and-drop / arrow reorder backlog items, Add story to backlog, Link story to requirement, Story points badge display.

---

## 7. Sprint Planning & Active Sprint Board Screens

### A. Sprint Planning & List
- **Route**: `/projects/:projectId/sprints`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `GET /api/projects/:projectId/sprints`
  - `POST /api/projects/:projectId/sprints`
  - `POST /api/sprints/:id/stories`
- **Actions**: Create Sprint (Name, Start/End Dates), Assign stories from backlog into sprint, Start Sprint (`status = ACTIVE`), Complete Sprint.

### B. Interactive Sprint Kanban Board
- **Route**: `/projects/:projectId/board` (or `/sprints/:sprintId/board`)
- **Intended Roles**: Project Members, `FACULTY`
- **API Endpoints**:
  - `GET /api/sprints/:id/board`
  - `PATCH /api/tasks/:id` (Move task between `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`)
- **Actions**: Drag/drop task cards between columns, filter tasks by assignee.

---

## 8. Tasks Management Screen

- **Route**: `/projects/:projectId/tasks`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `POST /api/stories/:storyId/tasks`
  - `GET /api/tasks/:id`
  - `PUT /api/tasks/:id`
  - `DELETE /api/tasks/:id`
- **Actions**: Create Task under User Story, assign to Team Member, change Task status.

---

## 9. Milestones & Deliverables Screen

- **Route**: `/projects/:projectId/deliverables`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `GET /api/projects/:projectId/milestones`
  - `POST /api/projects/:projectId/milestones`
  - `GET /api/milestones/:milestoneId/deliverables`
  - `POST /api/milestones/:milestoneId/deliverables`
  - `POST /api/deliverables/:id/submit` (Team Lead)
  - `POST /api/deliverables/:id/review` (Faculty)
- **Actions**: Add Milestone, Upload/Submit Deliverable URL, Submit for Review, Faculty Start Review, Approve Deliverable, Request Revision with feedback modal.

---

## 10. Bugs & Defect Tracker Screen

- **Route**: `/projects/:projectId/bugs`
- **Intended Roles**: Project Members, `TEAM_LEAD`, `FACULTY`
- **API Endpoints**:
  - `GET /api/projects/:projectId/bugs`
  - `POST /api/projects/:projectId/bugs`
  - `PUT /api/bugs/:id`
  - `DELETE /api/bugs/:id`
- **Actions**: Report Bug (title, severity, priority, linked story/task/PR), Assign Bug to team member (Team Lead/Faculty), Progress status (`OPEN` → `IN_PROGRESS` → `RESOLVED`), Close/Reopen bug.

---

## 11. End-to-End Traceability Matrix Screen

- **Route**: `/projects/:projectId/traceability`
- **Intended Roles**: All Roles
- **API Endpoints**:
  - `GET /api/traceability/project/:projectId`
  - `GET /api/traceability/project/:projectId/matrix`
- **Display Components**: Interactive matrix table showing columns: Requirement → User Story → Task → Sprint → Bug → GitHub PR URL. Color-coded status badges for each linked entity.

---

## 12. Faculty Dashboard Screen

- **Route**: `/faculty/dashboard` (Alias: `/faculty/projects`)
- **Intended Roles**: `FACULTY` only
- **API Endpoints**:
  - `GET /api/faculty/dashboard`
  - `GET /api/faculty/projects`
  - `GET /api/faculty/projects/:projectId/progress`
- **Display Components**:
  - Aggregated Metrics Summary Cards (Total Overseen Projects, Pending Requirement Reviews, Pending Deliverable Reviews, Average Milestone Progress).
  - Project Cards grid with overall completion progress bars.
  - Review Queue drawer for pending SRS requirements and submitted deliverables.

---

## 13. GitHub Integration Screen

- **Route**: `/projects/:projectId/github`
- **Intended Roles**: Project Members, `FACULTY`
- **API Endpoints**:
  - `GET /api/github/:projectId/connection`
  - `POST /api/github/connect`
  - `GET /api/github/:projectId/commits`
  - `GET /api/github/:projectId/branches`
  - `GET /api/github/:projectId/pulls`
  - `GET /api/github/:projectId/contributors`
- **Actions**: Connect Repository modal (`repoOwner`, `repoName`, `defaultBranch`), View Commits timeline, View Pull Requests list, View Branches list and Contributor stats.

---

## 14. Notifications Drawer / Screen

- **Route**: Modal / Drawer on all pages or `/notifications`
- **Intended Roles**: All Users
- **API Endpoints**:
  - `GET /api/notifications`
  - `GET /api/notifications/unread-count`
  - `POST /api/notifications/mark-all-read`
  - `PATCH /api/notifications/:id/read`
- **Actions**: View notification feed, unread counter badge, mark single or mark all as read.

---

## 15. Activity Log Feed Component

- **Route**: Embedded in Project Overview screen (`/projects/:projectId`)
- **Intended Roles**: All Project Members
- **API Endpoints**: `GET /api/projects/:projectId/activity?page=1&pageSize=20`
- **Display**: Paginated audit log timeline of project activities.
