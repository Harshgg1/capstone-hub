# CapstoneHub

CapstoneHub is a web platform for managing academic software engineering projects. It centralizes requirements/SRS management, Agile planning, tasks and sprints, milestones, deliverables, bugs, faculty review, project activity, notifications, and GitHub activity.

## Core Traceability
```
Requirement → User Story → Task → Sprint → Bug → GitHub Pull Request
```

## Tech Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Testing**: Vitest, Playwright
- **Deployment**: Docker
- **Integration**: GitHub REST API

## Project Structure
```
capstone-hub/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (>= 18)
- npm (>= 9)

### Installation
From the root directory:
```bash
npm install
```

### Running Backend in Development
```bash
npm run dev
```

### Building Backend
```bash
npm run build
```

### Running Tests
```bash
npm test
```
