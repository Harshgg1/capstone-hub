# Roles and Permissions Matrix (RBAC) — CapstoneHub

This document specifies the exact Role-Based Access Control (RBAC) rules enforced across CapstoneHub backend endpoints, controllers, and services.

---

## User Roles Overview

1. **`FACULTY`**: Academic advisor, supervisor, and evaluator. Oversees assigned projects, evaluates requirements and deliverables, reviews student work, and tracks system-wide metrics.
2. **`TEAM_LEAD`**: Student project manager / team lead. Responsible for team setup, sprint planning, product backlog management, story allocation, task assignment, bug triage, and submitting artifacts for faculty evaluation.
3. **`TEAM_MEMBER`** (Student): Team contributor. Responsible for drafting requirements/stories, picking up tasks, writing code, reporting bugs, and updating work progress.

---

## RBAC Matrix

| Resource / Action | `TEAM_MEMBER` | `TEAM_LEAD` | `FACULTY` |
|---|:---:|:---:|:---:|
| **Authentication & Profile** | | | |
| Register Account | ✅ (default) | ❌ (Promoted) | ✅ |
| Login / Refresh Token | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| **Projects & Teams** | | | |
| View Assigned Projects | ✅ | ✅ | ✅ (All overseen) |
| Create New Project | ✅ (Becomes Lead) | ✅ | ✅ (Faculty Advisor) |
| Update Project Details | ❌ | ✅ | ✅ |
| Add / Remove Team Members | ❌ | ✅ | ✅ |
| Change Team Member Roles | ❌ | ✅ | ✅ |
| **Requirements & SRS** | | | |
| View Requirements | ✅ | ✅ | ✅ |
| Create Requirement (Draft) | ✅ | ✅ | ✅ |
| Edit Requirement (Creates Version) | ✅ (If Author) | ✅ | ✅ |
| Submit Requirement for Review | ❌ | ✅ | ✅ |
| Approve / Reject Requirement | ❌ | ❌ | ✅ Only |
| Link Requirement to User Story | ✅ | ✅ | ✅ |
| **Agile & Product Backlog** | | | |
| View Product Backlog | ✅ | ✅ | ✅ |
| Add Story to Backlog | ✅ | ✅ | ✅ |
| Reorder Product Backlog | ❌ | ✅ | ✅ |
| Create / Manage Sprints | ❌ | ✅ | ✅ |
| Assign Stories to Sprint | ❌ | ✅ | ✅ |
| View Sprint Board | ✅ | ✅ | ✅ |
| **Tasks** | | | |
| Create Task | ✅ | ✅ | ✅ |
| Assign Task to Member | ❌ | ✅ | ✅ |
| Update Assigned Task Status | ✅ (Assignee/Author) | ✅ | ✅ |
| Delete Task | ❌ | ✅ | ✅ |
| **Milestones & Deliverables** | | | |
| View Milestones & Deliverables | ✅ | ✅ | ✅ |
| Create Milestone | ❌ | ✅ | ✅ |
| Create Deliverable (Draft) | ✅ | ✅ | ✅ |
| Submit Deliverable for Review | ❌ | ✅ | ✅ |
| Execute Deliverable Review (Approve/Revision) | ❌ | ❌ | ✅ Only |
| **Bugs & Defects** | | | |
| Report / Create Bug | ✅ | ✅ | ✅ |
| Assign Bug to Team Member | ❌ | ✅ | ✅ |
| Update Status (`OPEN` → `IN_PROGRESS` → `RESOLVED`) | ✅ (Assignee/Reporter) | ✅ | ✅ |
| Close / Reopen Bug | ✅ (Reporter Only) | ✅ | ✅ |
| **Traceability & GitHub** | | | |
| View Traceability Matrix | ✅ | ✅ | ✅ |
| Connect / Disconnect GitHub Repo | ❌ | ✅ | ✅ |
| View GitHub Commits/Branches/PRs | ✅ | ✅ | ✅ |
| **Faculty Dashboard** | | | |
| Access `/api/faculty/dashboard` | ❌ | ❌ | ✅ Only |
| View Overseen Projects & Progress Analytics | ❌ | ❌ | ✅ Only |

---

## Detailed Entity Permission Rules

### 1. Requirements Management
- `DRAFT`: Author or any team member can edit content. Edit creates a new entry in `RequirementVersion`.
- `IN_REVIEW`: Locks content editing. Can only be reviewed by `FACULTY`.
- `APPROVED` / `REJECTED`: Terminal status assigned by `FACULTY` via `POST /api/requirements/:id/review`.

### 2. Deliverables Workflow
- `DRAFT` / `REVISION_REQUESTED`: Team can update `fileUrl`, `title`, `description`. `TEAM_LEAD` or `FACULTY` can execute `POST /api/deliverables/:id/submit`.
- `SUBMITTED`: Awaiting review.
- `UNDER_REVIEW` → `APPROVED` or `REVISION_REQUESTED`: Executed exclusively by `FACULTY` via `POST /api/deliverables/:id/review`. Feedback is mandatory when requesting revisions.

### 3. Bug Assignment & Status
- **Assignment**: Only `TEAM_LEAD` or `FACULTY` can set `assigneeId`. The assignee MUST be a verified member of the project team.
- **Workflow (`OPEN` → `IN_PROGRESS` → `RESOLVED`)**: Can be performed by Assignee, Reporter, Team Lead, or Faculty.
- **Close & Reopen (`RESOLVED` → `CLOSED` or `CLOSED` → `OPEN`)**: Strictly restricted to Team Lead, Faculty, or the original Bug Reporter.

### 4. Faculty Dashboard Access
- Any request to `/api/faculty/*` requires `req.user.role === 'FACULTY'`. Non-faculty requests return `HTTP 403 Forbidden`.
