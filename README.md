# CapstoneHub

**CapstoneHub** is a software engineering project management and lifecycle platform tailored for academic software engineering capstone projects. It centralizes SRS requirement management, Agile planning, user stories, product backlog ordering, sprints, tasks, milestones, deliverables, bug defect tracking, faculty review/grading, activity feeds, notifications, and GitHub repository integration.

---

## 📚 Documentation & AI Agent Source of Truth

Complete documentation for developers and AI agents (Manus / Cursor / Copilot) is located in the [`/docs/`](./docs/) directory:

- [**AI Agent Handoff Master Guide** (`/docs/AI_FRONTEND_HANDOFF.md`)](./docs/AI_FRONTEND_HANDOFF.md) — Comprehensive guide for frontend development.
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
