# QIapp — Healthcare Quality Improvement Platform

## Project Overview

A modern platform for healthcare quality improvement teams. Tracks QI projects through structured methodologies (DMAIC, PDSA, LEAN), with Kanban boards for task management, AI-powered inbox for update processing, activity audit trails, and calendar views. Built for hospital QI departments to manage improvement cycles from planning through completion.

**Current status**: Module 1 (Project Management Engine), Module 1b (AI Inbox), Module 1 Polish, Gantt Timeline View, Module 2 (Metrics & Data Visualization), Module 3 (Survey & Feedback Collection), Module 5 (AI Meeting Notes → Actions), and Module 5b (Project Groups / Committees with Group-Level AI Meetings) are complete. Future modules (Reports, AI Feedback) are planned.

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js | 16.1.6 | App Router, React 19, Turbopack |
| Language | TypeScript | 5.x | Strict mode |
| Database | PostgreSQL | 17 | Local via Homebrew (keg-only) |
| ORM | Prisma | 7.4.2 | Driver adapter pattern (`@prisma/adapter-pg`) |
| Auth | NextAuth.js | 5.0.0-beta.30 | JWT strategy, Credentials provider |
| UI | Tailwind CSS | 4.x | New `@import "tailwindcss"` syntax |
| Components | shadcn/ui | 3.8.5 | New York style, Zinc base, CSS variables |
| Drag & Drop | @dnd-kit | core 6.3 + sortable 10.0 | Kanban board reordering |
| AI | @anthropic-ai/sdk | 0.52 | Claude API for inbox + meeting note processing |
| Icons | Lucide React | 0.575 | |
| Validation | Zod | 4.3 | `.issues` not `.errors` (v4 change) |
| Dates | date-fns | 4.1 | |
| Charts | Recharts | 2.x | Run charts, SPC control charts (dynamic import, SSR disabled) |
| Toasts | Sonner | 2.0 | |

## Conventions

### Naming

- **Variables/functions**: camelCase
- **Components**: PascalCase
- **Enums**: SCREAMING_SNAKE_CASE
- **Database tables**: snake_case via Prisma `@@map()`
- **Database columns**: snake_case via Prisma `@map()`
- **Files**: kebab-case (e.g., `kanban-board.tsx`, `auth-utils.ts`)

### Code Style

- Functional components with hooks
- Server Components by default; `'use client'` only where interactivity is needed
- Zod schemas for all API input validation
- Prisma queries in Server Components (no API round-trips for reads when possible)
- API Route Handlers for mutations only
- Consistent error shape: `{ error: string, details?: unknown }`
- Optimistic UI updates for drag-and-drop and inline edits

### Directory Structure

```
src/
  app/
    (auth)/               # Login/register (centered, no sidebar)
      login/page.tsx
      register/page.tsx
      layout.tsx
    (public)/              # Public pages (no auth, no sidebar)
      surveys/[surveyId]/page.tsx  # Public survey response page
      layout.tsx
    (dashboard)/          # Main app with sidebar + header
      page.tsx            # Dashboard
      projects/
        page.tsx          # Project list
        [projectId]/page.tsx  # Project detail (Board + Inbox + Activity + Timeline + Metrics + Surveys + Meetings tabs)
      groups/
        page.tsx          # Committees list
        [groupId]/page.tsx  # Committee detail (Projects + Meetings tabs)
      calendar/page.tsx   # Calendar view
      activity/page.tsx   # Global activity feed
      settings/page.tsx   # User profile & settings
      layout.tsx
      loading.tsx         # Dashboard loading skeleton
      error.tsx           # Dashboard error boundary
    api/
      auth/[...nextauth]/route.ts
      auth/register/route.ts
      projects/route.ts           # GET list + POST create
      projects/[projectId]/route.ts        # GET/PATCH/DELETE
      projects/[projectId]/members/route.ts
      projects/[projectId]/activity/route.ts
      projects/[projectId]/inbox/route.ts           # GET list + POST submit
      projects/[projectId]/inbox/[messageId]/route.ts        # GET/DELETE
      projects/[projectId]/inbox/[messageId]/actions/[actionId]/route.ts  # PATCH approve/reject
      projects/[projectId]/inbox/[messageId]/apply-all/route.ts    # POST bulk approve
      projects/[projectId]/inbox/[messageId]/reprocess/route.ts    # POST re-run LLM
      projects/[projectId]/metrics/route.ts                                  # GET list + POST create metric
      projects/[projectId]/metrics/[metricId]/route.ts                       # GET/PATCH/DELETE metric
      projects/[projectId]/metrics/[metricId]/data-points/route.ts           # POST add data point
      projects/[projectId]/metrics/[metricId]/data-points/[dataPointId]/route.ts  # DELETE data point
      projects/[projectId]/surveys/route.ts                                        # GET list + POST create survey
      projects/[projectId]/surveys/[surveyId]/route.ts                             # GET/PATCH/DELETE survey
      projects/[projectId]/surveys/[surveyId]/publish/route.ts                     # POST publish
      projects/[projectId]/surveys/[surveyId]/close/route.ts                       # POST close
      projects/[projectId]/surveys/[surveyId]/questions/route.ts                   # GET list + POST add question
      projects/[projectId]/surveys/[surveyId]/questions/[questionId]/route.ts      # PATCH/DELETE question
      projects/[projectId]/surveys/[surveyId]/responses/route.ts                   # GET list responses
      projects/[projectId]/meetings/route.ts                                             # GET list + POST submit meeting notes
      projects/[projectId]/meetings/[meetingId]/route.ts                                 # GET/DELETE meeting note
      projects/[projectId]/meetings/[meetingId]/actions/[actionId]/route.ts               # PATCH approve/reject action
      projects/[projectId]/meetings/[meetingId]/apply-all/route.ts                       # POST bulk approve
      projects/[projectId]/meetings/[meetingId]/reprocess/route.ts                       # POST re-run Claude
      surveys/[surveyId]/respond/route.ts                                          # GET/POST public response (no auth)
      groups/route.ts                                                              # GET list + POST create group
      groups/[groupId]/route.ts                                                    # GET/PATCH/DELETE group
      groups/[groupId]/members/route.ts                                            # GET list + POST add member
      groups/[groupId]/members/[memberId]/route.ts                                 # PATCH role + DELETE member
      groups/[groupId]/projects/route.ts                                           # GET list + POST link project
      groups/[groupId]/projects/[projectId]/route.ts                               # DELETE unlink project
      groups/[groupId]/meetings/route.ts                                           # GET list + POST submit (group-level AI)
      groups/[groupId]/meetings/[meetingId]/route.ts                               # GET/DELETE meeting note
      groups/[groupId]/meetings/[meetingId]/actions/[actionId]/route.ts            # PATCH approve/reject action
      groups/[groupId]/meetings/[meetingId]/apply-all/route.ts                     # POST bulk approve
      groups/[groupId]/meetings/[meetingId]/reprocess/route.ts                     # POST re-run Claude
      health/route.ts                                                              # GET health check (no auth)
      tasks/route.ts              # POST create
      tasks/[taskId]/route.ts     # PATCH/DELETE
      tasks/reorder/route.ts      # PUT batch reorder
      phases/[phaseId]/route.ts   # PATCH status
      users/route.ts              # GET user list
    layout.tsx            # Root layout (Inter font, Toaster)
    globals.css           # Tailwind v4 config + shadcn CSS variables
  components/
    ui/                   # shadcn/ui primitives (20 components)
    layout/               # Sidebar, Header, UserNav
    board/                # KanbanBoard, PhaseColumn, TaskCard
    projects/             # ProjectCard, StatusBadge, MethodologyBadge, CreateDialog
    tasks/                # TaskDetailSheet
    activity/             # ActivityFeed
    inbox/                # InboxTab, InboxComposeDialog, InboxMessageCard, InboxActionItem, InboxSettings
    calendar/             # CalendarView
    timeline/             # GanttChart (pure CSS/HTML horizontal bar chart)
    metrics/              # MetricsTab, MetricCard, MetricDetailSheet, RunChart, SPCChart, CreateMetricDialog, AddDataPointForm
    surveys/              # SurveysTab, SurveyCard, SurveyStatusBadge, CreateSurveyDialog, SurveyDetailSheet, SurveyResultsView, QuestionFormItem, PublicSurveyForm
    meetings/             # MeetingsTab, MeetingComposeDialog, MeetingNoteCard, MeetingActionItem
    groups/               # GroupCard, CreateGroupDialog, GroupMembersSection, AddGroupProjectDialog, GroupMeetingsTab, GroupMeetingComposeDialog
    session-provider.tsx  # NextAuth SessionProvider wrapper
  generated/
    prisma/               # Prisma client output (gitignored)
      client.ts           # Import PrismaClient from here
      enums.ts            # Import enum types from here
  lib/
    db.ts                 # Prisma client singleton (driver adapter pattern)
    auth.ts               # NextAuth config with role-aware JWT
    auth-utils.ts         # requireAuth(), requireRole(), requireProjectAccess(), requireGroupAccess()
    ai.ts                 # Anthropic SDK client singleton
    inbox-processor.ts    # Claude API processing pipeline (tool_use for structured extraction)
    inbox-actions.ts      # Apply/reject extracted inbox actions to DB
    action-resolvers.ts   # Shared fuzzy resolvers (resolvePhase, resolveAssignee, resolveTask, resolveProjectByTitle) for inbox + meetings
    meeting-processor.ts  # Claude API pipeline for meeting note processing — project-level + group-level (multi-project routing)
    meeting-actions.ts    # Apply/reject extracted meeting actions to DB
    constants.ts          # METHODOLOGY_PHASES, SYSTEM_ROLE_LEVEL, PROJECT_ROLE_LEVEL, GROUP_ROLE_LEVEL
    utils.ts              # cn() helper (clsx + tailwind-merge)
    activity-logger.ts    # logActivity() helper
    validations/
      project.ts          # Zod schemas for project CRUD
      task.ts             # Zod schemas for task CRUD + reorder
      inbox.ts            # Zod schemas for inbox submit + action review
      metric.ts           # Zod schemas for metric CRUD + data point entry
      survey.ts           # Zod schemas for survey CRUD + question + response submission
      meeting.ts          # Zod schemas for meeting note submission + action review
      group.ts            # Zod schemas for group CRUD, members, projects, group meeting submission
prisma/
  schema.prisma           # 19 models, 19 enums
  seed.ts                 # 4 users, 3 projects, 18 tasks, 3 inbox messages, 3 metrics, 18 data points, 2 surveys, 8 responses, 3 meeting notes (2 project + 1 group), 8 meeting actions, 1 committee, 11+ activity logs
  migrations/
prisma.config.ts          # Prisma config loading .env.local via dotenv
```

### Design System

- **Theme**: Light, clean, professional (Monday.com / Linear inspired)
- **Background**: white cards on `slate-50` page background
- **Borders**: `slate-200`
- **Primary accent**: QI green — `#266d50` / `oklch(0.44 0.1 160)`
- **Text**: `slate-900` primary, `slate-500` secondary
- **Cards**: `bg-white border border-slate-200 rounded-xl shadow-sm`
- **Font**: Inter (via `next/font/google`)

### Roles & Permissions

**System roles** (global, stored on `User.role`):
| Role | Level | Access |
|------|-------|--------|
| DIRECTOR | 4 | All projects, full CRUD, user management |
| PROJECT_LEAD | 3 | Own projects, can create projects |
| TEAM_MEMBER | 2 | Assigned projects only |
| VIEWER | 1 | Read-only on assigned projects |

**Project roles** (per-project, stored on `ProjectMember.role`):
| Role | Level | Access |
|------|-------|--------|
| LEAD | 3 | Edit all project/task fields, manage members |
| MEMBER | 2 | Edit all task fields |
| STAKEHOLDER | 1 | Update status on own assigned tasks only |

**Group roles** (per-committee, stored on `GroupMember.role`):
| Role | Level | Access |
|------|-------|--------|
| CHAIR | 3 | Full group management, delete group, manage all members |
| SECRETARY | 2 | Add members, link projects, manage meetings |
| MEMBER | 1 | View group, submit meeting notes |

### QI Methodologies

Each methodology auto-generates project phases on creation:

| Methodology | Phases |
|-------------|--------|
| DMAIC | Define, Measure, Analyze, Improve, Control |
| PDSA | Plan, Do, Study, Act |
| LEAN | Identify Value, Map Value Stream, Create Flow, Establish Pull, Seek Perfection |
| SIX_SIGMA | Define, Measure, Analyze, Improve, Control |
| OTHER | Phase 1, Phase 2, Phase 3 |

## Important Technical Notes

### Prisma 7 Specifics
- Uses `prisma-client` provider (not `prisma-client-js`)
- Requires driver adapter: `PrismaPg` from `@prisma/adapter-pg`
- Generated output at `src/generated/prisma/` — **no index file**; import from `client.ts` or `enums.ts` directly
- Config in `prisma.config.ts` loads env from `.env.local` via dotenv

### Zod v4 Specifics
- Error property is `.issues` (not `.errors` from v3)

### Tailwind v4 Specifics
- Uses `@import "tailwindcss"` syntax (not `@tailwind base/components/utilities`)
- Theme defined via `@theme inline {}` block with oklch colors
- No `tailwind.config.ts` — config lives in `globals.css`

### Database
- Local PostgreSQL 17 via Homebrew (keg-only, PATH: `/opt/homebrew/opt/postgresql@17/bin`)
- Connection: `postgresql://akbar@localhost:5432/qiapp?schema=public` (no password)

### Seed Data Credentials
| Role | Email | Password |
|------|-------|----------|
| Director | sarah.chen@hospital.org | password123 |
| Project Lead | james.wilson@hospital.org | password123 |
| Team Member | maria.garcia@hospital.org | password123 |
| Viewer | david.kim@hospital.org | password123 |

## Commands

```bash
npm run dev              # Start dev server (port 3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint
npx prisma migrate dev   # Run database migrations (local dev)
npx prisma migrate deploy  # Apply migrations (production, non-interactive)
npx prisma generate      # Regenerate Prisma client
npx prisma db seed       # Seed database with sample data
npx prisma studio        # Open database GUI
```

## Deployment (Railway)

Hosted on Railway with built-in PostgreSQL. Key files:

- **`railway.toml`** — Build & deploy configuration (nixpacks builder)
- **`next.config.ts`** — `output: "standalone"` for optimized production builds
- **`package.json`** — `postinstall: "prisma generate"` regenerates client on deploy
- **`src/app/api/health/route.ts`** — Health check endpoint (used by Railway)

**Build pipeline**: `prisma generate` → `prisma migrate deploy` → `next build`

**Required environment variables** (see `.env.example`):
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (auto-injected by Railway) |
| `NEXTAUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (e.g., `https://<app>.up.railway.app`) |
| `ANTHROPIC_API_KEY` | Claude API key for AI features |
| `AUTH_TRUST_HOST` | Set to `true` (required for NextAuth v5 behind reverse proxy) |

**Seeding production**: `railway run npx prisma db seed`

## Related Docs

- [Architecture](./docs/architecture.md) — System components, data flow, external services
- [Decisions](./docs/decisions.md) — Architectural Decision Records (ADRs)
- [Roadmap](./docs/roadmap.md) — Technical roadmap and milestones
- [Diagrams](./docs/diagrams.md) — ERD, flowcharts, sequence diagrams (Mermaid)
- [User Guide](./docs/user-guide.md) — Feature documentation and usage instructions
