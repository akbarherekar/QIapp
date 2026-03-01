# Architecture Overview

## System Context

QIapp is a healthcare Quality Improvement platform that helps hospital QI departments manage improvement projects through structured methodologies. It runs as a monolithic Next.js application with a PostgreSQL database.

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   Browser (SPA)   | <---> |   Next.js App     | <---> |   PostgreSQL 17   |
|   React 19 + RSC  |       |   App Router      |       |   (local)         |
|                   |       |   Port 3000        |       |   Port 5432       |
+-------------------+       +-------------------+       +-------------------+
```

There are no external APIs, message queues, or third-party services in the current build. Authentication is self-contained (Credentials provider with bcrypt). Future modules may introduce external AI services.

---

## Application Layers

### 1. Presentation Layer

**Server Components** (default): Pages and layouts that fetch data directly via Prisma. No API round-trip overhead for reads.

**Client Components** (`'use client'`): Interactive UI that requires browser APIs or React state:
- `KanbanBoard` — drag-and-drop with @dnd-kit
- `TaskDetailSheet` — inline editing with debounced auto-save
- `CalendarView` — month navigation and date selection
- `CreateProjectDialog` — multi-section form with controlled state
- `Sidebar` — collapse toggle
- `UserNav` — dropdown with sign-out

**Route Groups**:
- `(auth)/` — Login and register pages. Centered layout, no sidebar. Accessible without authentication.
- `(dashboard)/` — All authenticated pages. Sidebar + header layout. Server-side session check redirects to `/login` if unauthenticated.

### 2. API Layer

Route Handlers under `src/app/api/` handle all mutations. Every mutation:
1. Validates input with Zod
2. Checks authentication via `auth()` or `requireAuth()`
3. Checks authorization (system role + project role)
4. Performs the database operation
5. Logs activity via `logActivity()`
6. Returns JSON response

**API Routes**:

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers (login/logout/session) |
| `/api/auth/register` | POST | User registration |
| `/api/projects` | GET, POST | List projects (filtered by role) + Create project |
| `/api/projects/[id]` | GET, PATCH, DELETE | Single project CRUD |
| `/api/projects/[id]/members` | POST | Add project member |
| `/api/projects/[id]/activity` | GET | Paginated project activity |
| `/api/tasks` | POST | Create task in a phase |
| `/api/tasks/[id]` | PATCH, DELETE | Update/delete task |
| `/api/tasks/reorder` | PUT | Batch reorder after drag-and-drop |
| `/api/phases/[id]` | PATCH | Update phase status |
| `/api/users` | GET | List users (for assignee pickers) |

### 3. Data Layer

**Prisma 7** with the PostgreSQL driver adapter pattern:

```
PrismaPg adapter (connection string)
  └── PrismaClient (singleton, hot-reload safe)
       └── db export from src/lib/db.ts
```

The Prisma client is generated to `src/generated/prisma/` with separate entry points:
- `client.ts` — `PrismaClient` class
- `enums.ts` — TypeScript enum types

**Singleton pattern**: `globalForPrisma` prevents multiple Prisma clients during Next.js hot-reload in development.

### 4. Authentication & Authorization

**NextAuth v5** (beta) with JWT strategy:

```
Request → auth() middleware → JWT decode → session.user
                                            ├── id
                                            ├── email
                                            ├── name
                                            ├── role (SystemRole)
                                            └── department
```

**Authorization helpers** (`src/lib/auth-utils.ts`):
- `getCurrentUser()` — Returns session user or null
- `requireAuth()` — Returns user or redirects to `/login`
- `requireRole(...roles)` — Throws if user lacks required system role
- `requireProjectAccess(projectId, minRole?)` — Checks project membership with optional minimum project role. Directors bypass all project-level checks.

**Two-tier role model**:
1. **System roles** (User.role): DIRECTOR > PROJECT_LEAD > TEAM_MEMBER > VIEWER
2. **Project roles** (ProjectMember.role): LEAD > MEMBER > STAKEHOLDER

### 5. Activity Logging

Every mutation calls `logActivity()` which writes to the `activity_logs` table:

```typescript
{
  projectId: string    // Which project
  userId: string       // Who did it
  action: string       // e.g., "TASK_COMPLETED", "PHASE_STATUS_CHANGED"
  details: string      // Human-readable description
  source: ActivitySource  // MANUAL | AI_MEETING | AI_FEEDBACK | SYSTEM
  metadata: JSON       // Structured data for future module use
}
```

The `source` and `metadata` fields are designed for future modules (AI meeting notes, feedback categorization) to write back into the activity stream.

---

## Key Design Patterns

### Server-First Data Fetching
Dashboard, project list, project detail, calendar, and activity pages are all Server Components. They call Prisma directly, avoiding API overhead. The dashboard uses `Promise.all` to parallelize 6 queries.

### Optimistic Updates
The Kanban board updates local state immediately on drag-end, then fires the API call in the background. If the API call fails, the UI would need to revert (not yet implemented — future improvement).

### Debounced Auto-Save
The task detail sheet (`TaskDetailSheet`) debounces field changes by 300ms before sending PATCH requests. This prevents excessive API calls during rapid editing.

### Methodology-Driven Phases
When a project is created, the API automatically generates `ProjectPhase` records from the methodology template in `constants.ts`. This ensures every project has the correct phase structure without manual setup.

### Status Automations
- Task marked DONE → sets `completedAt` timestamp
- Last task in a phase marked DONE → prompts to mark phase COMPLETED
- First task in a phase set to IN_PROGRESS → auto-marks phase IN_PROGRESS

---

## Infrastructure

### Development
- Local PostgreSQL 17 (Homebrew, keg-only)
- Next.js dev server with Turbopack on port 3000
- No Docker, no CI/CD pipeline yet

### Production (Not Yet Configured)
- No deployment target selected
- No environment variable management beyond `.env.local`
- No CDN or caching layer

---

## Security Model

- Passwords hashed with bcrypt (12 rounds)
- JWT-based sessions (no database session table)
- Server-side auth checks on every page and API route
- Project-level access control prevents cross-tenant data leakage
- No CSRF protection beyond Next.js defaults (JWT in httpOnly cookie)
- No rate limiting (future improvement)
