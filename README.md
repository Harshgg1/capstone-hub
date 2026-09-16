# CapstoneHub

**CapstoneHub** is a software engineering project management and lifecycle platform tailored for academic software engineering capstone projects. It centralizes SRS requirement management, Agile planning, user stories, product backlog ordering, sprints, tasks, milestones, deliverables, bug defect tracking, faculty review/grading, activity feeds, notifications, and GitHub repository integration.

---

## 📚 Documentation & AI Agent Source of Truth

Complete documentation for developers and AI agents (Manus / Cursor / Copilot) is located in the [`/docs/`](./docs/) directory:

- [**API Endpoint Documentation** (`/docs/API.md`)](./docs/API.md) — Reference for all backend REST endpoints.
- [**Roles & Permissions Matrix (RBAC)** (`/docs/ROLES_AND_PERMISSIONS.md`)](./docs/ROLES_AND_PERMISSIONS.md) — Role-based authorization rules.
- [**Data Model Reference** (`/docs/DATA_MODEL.md`)](./docs/DATA_MODEL.md) — Prisma entities and TypeScript data models.
- [**Authentication & Security Spec** (`/docs/AUTH.md`)](./docs/AUTH.md) — JWT authentication flow and token rules.
- [**API Client & Request Guide** (`/docs/API_CLIENT_GUIDE.md`)](./docs/API_CLIENT_GUIDE.md) — Request conventions, error formats, and parameters.
- [**Frontend Screen Specifications** (`/docs/FRONTEND_SPEC.md`)](./docs/FRONTEND_SPEC.md) — UI screen maps, routes, and user actions.
- [**Backend Status & Audit Report** (`/docs/BACKEND_STATUS.md`)](./docs/BACKEND_STATUS.md) — Backend MVP verification report.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL 17 Alpine (Docker container)
- **Frontend (Target)**: React 18, TypeScript, Tailwind CSS, Vite
- **Testing**: Vitest, Supertest (370 tests passing)

---

## 🔑 Available User Roles

1. **`FACULTY`**: Advisor / evaluator role. Reviews and approves requirements, evaluates deliverables with feedback, and monitors project metrics.
2. **`TEAM_LEAD`**: Student project lead. Manages project teams, sprint planning, product backlog ordering, task allocation, bug assignment, and deliverable submissions.
3. **`TEAM_MEMBER`**: Student team contributor. Creates requirements/stories, updates assigned task progress, and reports/fixes bugs.

---

## ⚙️ Setup & Installation

### 1. Prerequisites

- Node.js (>= 18)
- npm (>= 9)
- Docker & Docker Compose

### 2. Database Container Setup

Start PostgreSQL 17 Alpine container:

```bash
docker compose up -d
```

### 3. Environment Variables Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Default environment variables:

```env
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/capstone_hub?schema=public"
JWT_SECRET=capstonehub-dev-secret-key-change-in-prod
JWT_EXPIRES_IN=7d
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Database Migrations & Seed Data

```bash
npm run db:migrate --workspace=backend
npm run db:seed
```

#### Seed Demo Credentials:

- **Faculty**: `faculty@example.com` / `Password123!`
- **Team Lead**: `lead@example.com` / `Password123!`
- **Team Member 1**: `bob@example.com` / `Password123!`
- **Team Member 2**: `charlie@example.com` / `Password123!`
- **Unassigned User**: `dave@example.com` / `Password123!`

---

## 🚀 Running Development Servers

### Start Backend API Server (Port 5001)

```bash
npm run dev:backend
# API server running on http://localhost:5001/api
```

### Start Frontend Server (Port 5173)

```bash
npm run dev:frontend
```

### Run All Backend Unit & Integration Tests

```bash
npm test
```

---

## 📐 Architecture & End-to-End Traceability

```
Requirement → User Story → Task → Sprint → Bug → GitHub Pull Request
```

### Core MVP Capabilities:

1. **SRS Requirements**: Functional/Non-Functional requirement authoring, auto-versioning, faculty review & approval.
2. **Agile Sprints & Backlogs**: Array-ordered product backlog, sprint creation, drag-and-drop story/task boards.
3. **Milestones & Deliverables**: Deadlines and deliverable state machine (`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `APPROVED`/`REVISION_REQUESTED`).
4. **Bug & Defect Tracking**: Defect management with assignment guards, state workflow (`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`), and traceability.
5. **Traceability Matrix**: Complete hierarchical trace graph from requirement to GitHub PR.
6. **Faculty Dashboards**: Progress metrics, milestone completion ratios, and review queues.
7. **GitHub Integration**: Repository connection proxy fetching commits, branches, PRs, and contributor stats.

## UML Diagrams

### 1. Use Case Diagram

```mermaid
flowchart LR
    Faculty((Faculty))
    Lead((Team Lead))
    Member((Team Member))

    subgraph CapstoneHub
        UC1[Review Projects]
        UC2[Review Requirements]
        UC3[Review Deliverables]
        UC4[Monitor Progress]

        UC5[Manage Team]
        UC6[Assign Tasks]
        UC7[Manage Bugs]
        UC8[Manage Project]
        UC13[Manage Requirements]
        UC14[Manage Sprints]
        UC15[Manage Deliverables]

        UC9[Work on Tasks]
        UC10[Update Progress]
        UC16[View GitHub Activity]
        UC11[Resolve Bugs]
        UC12[Contribute Documentation]
    end

    Faculty --> UC1
    Faculty --> UC2
    Faculty --> UC3
    Faculty --> UC4

    Lead --> UC5
    Lead --> UC6
    Lead --> UC7
    Lead --> UC8
    Lead --> UC13
    Lead --> UC14
    Lead --> UC15
    Lead --> UC16

    Member --> UC9
    Member --> UC10
    Member --> UC16
    Member --> UC11
    Member --> UC12

```

### 2. Class Diagram

```mermaid
classDiagram

class User {
    +userId
    +name
    +email
    +role
}

class Project {
    +projectId
    +name
    +description
    +status
}

class Requirement {
    +requirementId
    +title
    +type
    +priority
    +status
    +version
}

class UserStory {
    +storyId
    +title
    +description
    +storyPoints
    +status
}

class Task {
    +taskId
    +title
    +status
    +priority
}

class Sprint {
    +sprintId
    +name
    +startDate
    +endDate
    +status
}

class Bug {
    +bugId
    +title
    +description
    +status
    +priority
}

class Milestone {
    +milestoneId
    +name
    +dueDate
    +status
}

class Deliverable {
    +deliverableId
    +name
    +type
    +status
}

class ActivityRecord {
    +activityId
    +action
    +timestamp
}

class Notification {
    +notificationId
    +message
    +readStatus
}

User "1" --> "*" Project : participates in
Project "1" --> "*" Requirement : contains
Requirement "1" --> "*" UserStory : traces to
UserStory "1" --> "*" Task : contains
Sprint "1" --> "*" Task : includes
Task "*" --> "0..1" Bug : may have
Project "1" --> "*" Sprint : has
Project "1" --> "*" Milestone : has
Milestone "1" --> "*" Deliverable : contains
User "1" --> "*" ActivityRecord : generates
User "1" --> "*" Notification : receives
User "*" --> "*" Task : assigned to
User "*" --> "*" Bug : assigned to
```

### 3. Requirement Review — Sequence Diagram

```mermaid
sequenceDiagram
    actor TeamLead as Team Lead
    actor Faculty
    participant System as CapstoneHub
    participant DB as Database

    TeamLead->>System: Create requirement
    System->>DB: Save requirement
    DB-->>System: Requirement saved

    TeamLead->>System: Submit requirement for review
    System->>DB: Update status to "Under Review"
    System-->>Faculty: Notify pending review

    Faculty->>System: Review requirement

    alt Approved
        Faculty->>System: Approve requirement
        System->>DB: Update status to "Approved"
        System-->>TeamLead: Approval notification
    else Revision Required
        Faculty->>System: Request revision
        System->>DB: Update status to "Revision Required"
        System-->>TeamLead: Revision notification
    end
```

### 4. Bug Lifecycle — Activity Diagram

```mermaid
flowchart TD
    A([Bug Reported]) --> B[Create Bug]
    B --> C[Assign Bug to Team Member]
    C --> D[Set Status: In Progress]
    D --> E[Developer Investigates]
    E --> F{Bug Fixed?}

    F -- No --> E
    F -- Yes --> G[Set Status: Fixed]
    G --> H[Team Lead Reviews]
    H --> I{Resolution Accepted?}

    I -- Yes --> J[Close Bug]
    I -- No --> K[Reopen Bug]
    K --> D

    J --> L([Bug Resolved])
```

### 5. System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        UI["React + TypeScript + Tailwind CSS"]
    end

    subgraph Backend["Application Layer"]
        API["Node.js + Express REST API"]

        AUTH["Authentication & RBAC"]
        PROJECT["Project & Team Management"]
        REQ["Requirements & SRS"]
        AGILE["Agile / Sprint / Task Management"]
        BUG["Bug Management"]
        DEL["Milestones & Deliverables"]
        NOTIF["Activity & Notifications"]
        GH["GitHub Integration"]
    end

    subgraph Data["Data Layer"]
        PRISMA["Prisma ORM"]
        DB[("PostgreSQL Database")]
    end

    subgraph External["External Services"]
        GITHUB["GitHub REST API"]
    end

    UI --> API

    API --> AUTH
    API --> PROJECT
    API --> REQ
    API --> AGILE
    API --> BUG
    API --> DEL
    API --> NOTIF
    API --> GH

    AUTH --> PRISMA
    PROJECT --> PRISMA
    REQ --> PRISMA
    AGILE --> PRISMA
    BUG --> PRISMA
    DEL --> PRISMA
    NOTIF --> PRISMA

    PRISMA --> DB

    GH <--> GITHUB
```

### 6. Development Traceability

```mermaid
flowchart LR
    R[Requirement]
    US[User Story]
    T[Task]
    S[Sprint]
    B[Bug]
    PR[GitHub Pull Request]

    R -->|refined into| US
    US -->|broken down into| T
    T -->|planned in| S
    T -->|may reveal| B
    B -->|fixed through| PR
```
