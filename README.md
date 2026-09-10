# CapstoneHub

CapstoneHub is a web platform for managing academic software engineering projects. It centralizes requirements/SRS management, Agile planning, tasks and sprints, milestones, deliverables, bugs, faculty review, project activity, notifications, and GitHub activity.

## Core Traceability

```
Requirement → User Story → Task → Sprint → Bug → GitHub Pull Request
```

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL 17 Alpine, Prisma ORM
- Testing: Vitest, Playwright
- Deployment: Docker
- Integration: GitHub REST API

## Project Structure

```
capstone-hub/
├── docker-compose.yml
├── package.json
├── README.md
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── App.tsx
    │   ├── index.css
    │   └── main.tsx
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── tsconfig.node.json
    └── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js (>= 18)
- npm (>= 9)
- Docker & Docker Compose

### 1. Database Setup (PostgreSQL 17 Alpine)

Start the PostgreSQL 17 Alpine database container using Docker Compose:

```bash
docker compose up -d
```

To stop the database:

```bash
docker compose down
```

### 2. Dependency Installation

From the root directory:

```bash
npm install
```

### 3. Database Migration

Apply Prisma migrations to the PostgreSQL database:

```bash
npm run db:migrate --workspace=backend
```

To view and manage data in Prisma Studio:

```bash
npm run db:studio --workspace=backend
```

### 4. Running the Development Servers

Run backend (port 5001):

```bash
npm run dev:backend
```

Run frontend (port 5173):

```bash
npm run dev:frontend
```

### 5. Building the Projects

```bash
npm run build
```

### 6. Running Tests

```bash
npm test
```

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

        UC9[Work on Tasks]
        UC10[Update Progress]
        UC11[Resolve Bugs]
        UC12[Contribute Documentation]

        UC13[Manage Requirements]
        UC14[Manage Sprints]
        UC15[Manage Deliverables]
        UC16[View GitHub Activity]
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
    Member --> UC11
    Member --> UC12
    Member --> UC16
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

    GH <--> GITHUB``mermaid
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
