# Architecture Overview

> **Version History**
> - **v0.1.0** (2026-02-28) — Module 1: Project Management Engine
> - **v0.1.1** (2026-03-01) — Module 1b: AI Inbox
> - **v0.1.2** (2026-03-01) — Module 1 Polish (loading states, error boundaries, filtering, pagination)
> - **v0.2.0** (2026-03-01) — Gantt Timeline View + Module 2: Metrics & Data Visualization
> - **v0.3.0** (2026-03-02) — Module 3: Survey & Feedback Collection

## System Context

QIapp is a healthcare Quality Improvement platform that helps hospital QI departments manage improvement projects through structured methodologies. It runs as a monolithic Next.js application with a PostgreSQL database.

```
+-------------------+       +-------------------+       +-------------------+
|                   |       |                   |       |                   |
|   Browser (SPA)   | <---> |   Next.js App     | <---> |   PostgreSQL 17   |
|   React 19 + RSC  |       |   App Router      |       |   (local)         |
|                   |       |   Port 3000        |       |   Port 5432       |
+-------------------+       +-------------------+       +-------------------+
                                     |
                                     v
                            +-------------------+
                            |   Claude API      |
                            |   (Anthropic)     |
                            |   Inbox processing|
                            +-------------------+
```

The application integrates with the **Claude API** (Anthropic) for AI-powered inbox message processing. Authentication is self-contained (Credentials provider with bcrypt).

---

## Application Layers

### 1. Presentation Layer

**Server Components** (default): Pages and layouts that fetch data directly via Prisma. No API round-trip overhead for reads.

**Client Components** (`'use client'`): Interactive UI that requires browser APIs or React state:
- `KanbanBoard` — drag-and-drop with @dnd-kit
- `TaskDetailSheet` — inline editing with debounced auto-save
- `CalendarView` — month navigation and date selection
- `CreateProjectDialog` — multi-section form with controlled state
- `InboxTab` — inbox message list with filter chips
- `InboxComposeDialog` — submit update form with LLM processing
- `InboxMessageCard` — message card with approve/reject actions
- `InboxActionItem` — individual action approval UI
- `GanttChart` — CSS-based timeline with phase/task bars *(v0.2.0)*
- `MetricsTab` — metric cards grid with CRUD state management *(v0.2.0)*
- `MetricDetailSheet` — full chart view with data table *(v0.2.0)*
- `RunChart` / `SPCChart` — Recharts line charts (dynamically imported, SSR disabled) *(v0.2.0)*
- `CreateMetricDialog` — metric definition form *(v0.2.0)*
- `AddDataPointForm` — inline data point entry *(v0.2.0)*
- `SurveysTab` — survey card grid with CRUD state management *(v0.3.0)*
- `SurveyDetailSheet` — questions/results toggle with publish/close actions *(v0.3.0)*
- `SurveyResultsView` — per-question aggregate charts (Recharts bar charts) *(v0.3.0)*
- `CreateSurveyDialog` — multi-question survey builder form *(v0.3.0)*
- `QuestionFormItem` — reusable question row with type/options/required controls *(v0.3.0)*
- `PublicSurveyForm` — unauthenticated survey response form with 5 question type renderers *(v0.3.0)*
- `Sidebar` — collapse toggle
- `UserNav` — dropdown with sign-out

**Route Groups**:
- `(auth)/` — Login and register pages. Centered layout, no sidebar. Accessible without authentication.
- `(public)/` — Public pages with minimal layout (no sidebar/header). Currently used for survey response pages. Accessible without authentication. *(v0.3.0)*
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
| `/api/projects/[id]/inbox` | GET, POST | List inbox messages + Submit manual message (triggers LLM) |
| `/api/projects/[id]/inbox/[msgId]` | GET, DELETE | Message detail + Discard |
| `/api/projects/[id]/inbox/[msgId]/actions/[actionId]` | PATCH | Approve or reject a single action |
| `/api/projects/[id]/inbox/[msgId]/apply-all` | POST | Bulk approve all pending actions |
| `/api/projects/[id]/inbox/[msgId]/reprocess` | POST | Re-run LLM processing on a failed message |
| `/api/users` | GET | List users (for assignee pickers) |
| `/api/projects/[id]/metrics` | GET, POST | List metrics + Create metric definition *(v0.2.0)* |
| `/api/projects/[id]/metrics/[mId]` | GET, PATCH, DELETE | Single metric CRUD *(v0.2.0)* |
| `/api/projects/[id]/metrics/[mId]/data-points` | POST | Add data point to metric *(v0.2.0)* |
| `/api/projects/[id]/metrics/[mId]/data-points/[dpId]` | DELETE | Remove data point *(v0.2.0)* |
| `/api/projects/[id]/surveys` | GET, POST | List surveys + Create survey with questions *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]` | GET, PATCH, DELETE | Single survey CRUD *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]/publish` | POST | Publish a draft survey *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]/close` | POST | Close a published survey *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]/questions` | GET, POST | List + add questions *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]/questions/[qId]` | PATCH, DELETE | Edit/delete questions *(v0.3.0)* |
| `/api/projects/[id]/surveys/[sId]/responses` | GET | List survey responses *(v0.3.0)* |
| `/api/surveys/[sId]/respond` | GET, POST | **Public** — fetch survey + submit response (no auth) *(v0.3.0)* |

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

### 5. AI Inbox Processing

The inbox pipeline processes free-text messages into structured project actions:

```
User pastes message → POST /api/projects/[id]/inbox
  → Create InboxMessage (status: RECEIVED)
  → processInboxMessage(messageId)
      → Load project context (phases, members, recent tasks)
      → Call Claude API with tool_use (process_inbox_message tool)
      → Parse tool_use response → Create InboxAction records
      → Set message status to REVIEWED
  → Return message + actions to UI
```

**Key components**:
- `src/lib/ai.ts` — Anthropic SDK client singleton (hot-reload safe)
- `src/lib/inbox-processor.ts` — LLM pipeline with tool_use for structured extraction
- `src/lib/inbox-actions.ts` — Apply extracted actions to DB (create tasks, update statuses, log notes)

**Review flow**: Messages default to `REVIEWED` status (human review required). Project leads can approve/reject individual actions or bulk approve. If `project.inboxAutoApply` is true, actions are applied immediately.

### 6. Activity Logging

Every mutation calls `logActivity()` which writes to the `activity_logs` table:

```typescript
{
  projectId: string    // Which project
  userId: string       // Who did it
  action: string       // e.g., "TASK_COMPLETED", "PHASE_STATUS_CHANGED"
  details: string      // Human-readable description
  source: ActivitySource  // MANUAL | AI_MEETING | AI_FEEDBACK | AI_INBOX | SYSTEM
  metadata: JSON       // Structured data for future module use
}
```

The `source` and `metadata` fields support multiple modules writing into the activity stream. The AI Inbox uses `source: "AI_INBOX"` for all inbox-applied actions.

**Metrics activity actions** *(v0.2.0)*: `METRIC_CREATED`, `METRIC_UPDATED`, `METRIC_DELETED`, `DATA_POINT_ADDED` — all logged with `source: "SYSTEM"`.

**Survey activity actions** *(v0.3.0)*: `SURVEY_CREATED`, `SURVEY_UPDATED`, `SURVEY_PUBLISHED`, `SURVEY_CLOSED`, `SURVEY_DELETED`, `SURVEY_RESPONSE_RECEIVED` — all logged with `source: "SYSTEM"`.

### 7. Gantt Timeline View *(v0.2.0)*

A read-only horizontal bar chart showing project phases and tasks over time:

- **Pure CSS/HTML** — no charting library needed; uses `div` elements with absolute positioning and percentage-based widths
- **Phase swimlanes** with colored status indicators (green=COMPLETED, blue=IN_PROGRESS, gray=NOT_STARTED)
- **Task bars** nested under phases, color-coded by status: TODO=slate, IN_PROGRESS=blue, DONE=emerald
- **Today marker** — red dashed vertical line showing current date
- **Month headers** — auto-generated from the date range of all phases/tasks
- **Tooltips** on hover showing task details (shadcn/ui Tooltip)
- **Empty state** when no dates are set on phases/tasks
- Data comes from existing `ProjectPhase.startDate/targetDate` and `Task.dueDate` fields — no additional queries needed

### 8. Metrics & Data Visualization *(v0.2.0)*

Enables QI teams to track quality metrics over time with statistical process control:

**Data model**:
- `MetricDefinition` — named metric with optional unit, target, and upper/lower control limits
- `MetricDataPoint` — individual value recorded at a point in time with optional notes

**Chart types**:
- **Run Chart** — line chart with calculated median and optional target reference line
- **SPC Control Chart** — line chart with center line (mean), UCL/LCL (mean ± 3σ or user-defined bounds), and out-of-control point highlighting (red dots for values beyond control limits)

**UI flow**: Metric cards grid → click card → detail sheet (with chart toggle + data table) → add data points inline

**Permissions**:
| Action | Required Role |
|--------|--------------|
| View metrics | Any project member |
| Create / edit / delete metrics | DIRECTOR or project LEAD |
| Add data points | DIRECTOR, LEAD, or MEMBER |
| Delete data points | DIRECTOR or project LEAD |

**Technical approach**:
- Recharts library for chart rendering (dynamically imported with `next/dynamic` + `ssr: false` to avoid SSR issues)
- Server Component fetches metrics with data points → serializes dates as ISO strings → passes to `MetricsTab` client component
- Client-side state management for CRUD operations (optimistic updates with toast feedback)

### 9. Survey & Feedback Collection *(v0.3.0)*

Enables QI teams to create surveys, distribute them via public links, collect anonymous responses, and view aggregate results.

**Data model** (4 new models):
- `Survey` — project-linked survey with title, description, and lifecycle status (DRAFT → PUBLISHED → CLOSED)
- `SurveyQuestion` — individual question with text, type, required flag, and JSON options (for MULTIPLE_CHOICE)
- `SurveyResponse` — a single respondent's submission with optional name and timestamp
- `SurveyAnswer` — individual answer linking a response to a question with a string value

**Question types** (5):
- `TEXT` — free-form text area
- `RATING` — 1-5 numeric scale
- `MULTIPLE_CHOICE` — select from predefined options (stored in JSON `options` field)
- `YES_NO` — binary yes/no buttons
- `LIKERT_SCALE` — 5-point agree/disagree scale

**Survey lifecycle**:
1. Create survey as DRAFT with questions via `POST /api/projects/[id]/surveys`
2. Add/edit/remove questions while in DRAFT status
3. Publish → sets status to PUBLISHED, generates public link `/surveys/[surveyId]`
4. Respondents submit answers via unauthenticated `POST /api/surveys/[surveyId]/respond`
5. Close → sets status to CLOSED, no more responses accepted

**Public survey page** (`(public)` route group):
- Server Component fetches survey via Prisma directly (no auth required)
- `PublicSurveyForm` client component renders appropriate inputs for each question type
- Shows thank-you state after successful submission

**Results visualization**:
- `SurveyResultsView` renders per-question aggregate charts using dynamically imported Recharts
- RATING: average score + bar chart distribution
- YES_NO / MULTIPLE_CHOICE / LIKERT: horizontal bar charts with counts
- TEXT: scrollable list of free-text responses

**Permissions**:
| Action | Required Role |
|--------|--------------|
| View surveys & results | Any project member |
| Create / edit / delete surveys | DIRECTOR or project LEAD |
| Publish / close surveys | DIRECTOR or project LEAD |
| Submit responses (public) | No auth required |

---

## Key Design Patterns

### Server-First Data Fetching
Dashboard, project list, project detail, calendar, and activity pages are all Server Components. They call Prisma directly, avoiding API overhead. The dashboard uses `Promise.all` to parallelize 7 queries (including pending inbox review count). The project detail page parallelizes inbox messages, pending review count, metrics data, and surveys in a single `Promise.all` *(v0.3.0)*.

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

### Dynamic Imports for Charts *(v0.2.0)*
Recharts components (`RunChart`, `SPCChart`) are loaded with `next/dynamic` + `ssr: false` to avoid server-side rendering issues with the chart library. This keeps the initial page load fast while loading charts on demand.

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
