# Technical Roadmap

## Module Overview

| # | Module | Status | Description |
|---|--------|--------|-------------|
| 1 | Project Management Engine | **Complete** | Core project/task/phase management with Kanban, calendar, activity |
| 1b | AI Inbox | **Complete** | AI-powered inbox: paste updates → Claude extracts actions → human review → apply |
| 2 | Metrics & Data Visualization | Planned | Chart dashboards, run charts, SPC control charts |
| 3 | Survey & Feedback Collection | Planned | Patient/staff surveys with templates |
| 4 | Report Generation | Planned | PDF/export for QI project reports |
| 5 | AI Meeting Notes → Actions | Planned | Transcribe meetings, extract action items, create tasks |
| 6 | AI Feedback Categorization | Planned | Categorize open-ended survey responses with AI |

---

## Module 1: Project Management Engine (COMPLETE)

### What was built

**Pages**:
- Dashboard (`/`) — Stats row, recent projects with progress bars, recent activity
- Projects list (`/projects`) — Card grid with filters, search, create dialog
- Project detail (`/projects/[id]`) — Header with metrics, Kanban board tab, activity tab
- Calendar (`/calendar`) — Monthly grid with task due date dots, selected date detail panel
- Activity (`/activity`) — Global activity feed across all projects

**Core features**:
- Full CRUD for projects, tasks, phases, and members
- Kanban board with drag-and-drop (cross-phase moves + intra-phase reorder)
- Task detail sheet with inline editing and debounced auto-save
- Methodology-driven auto-phase generation (DMAIC, PDSA, LEAN, SIX_SIGMA, OTHER)
- Two-tier RBAC (system roles + project roles)
- Activity audit trail on every mutation
- Seed data with 4 users, 3 projects, realistic tasks and activity

### Remaining polish (Module 1)

- [ ] Loading skeletons (`loading.tsx`) for all route segments
- [ ] Error boundaries (`error.tsx`) for all route segments
- [x] Settings page
- [ ] Gantt/timeline view (read-only horizontal bar chart)
- [ ] Optimistic update rollback on API failure (Kanban board)
- [ ] Task filtering and search within the Kanban board
- [ ] Pagination on the global activity page
- [ ] Empty state illustrations

---

## Module 1b: AI Inbox (COMPLETE)

### What was built

**Schema additions**:
- `InboxMessage` model — stores raw messages with LLM processing results
- `InboxAction` model — extracted actions (CREATE_TASK, UPDATE_TASK, COMPLETE_TASK, ADD_NOTE, STATUS_UPDATE)
- 4 new enums: `InboxMessageChannel`, `InboxMessageStatus`, `InboxActionType`, `InboxActionStatus`
- `AI_INBOX` added to `ActivitySource` enum
- Project fields: `inboxEnabled`, `inboxAutoApply`, `inboxShortcode`

**Processing pipeline** (`src/lib/inbox-processor.ts`):
- Claude API integration using **tool_use** for guaranteed structured JSON output
- System prompt tailored for healthcare QI context
- Extracts classification, summary, and actionable items from free-text messages
- Model: `claude-sonnet-4-20250514` (fast, cost-effective for structured extraction)

**Action application** (`src/lib/inbox-actions.ts`):
- `applyInboxAction()` — resolves phases/assignees/tasks by fuzzy name matching, creates/updates records
- `rejectInboxAction()`, `applyAllPendingActions()`, `rejectAllPendingActions()`
- All applied actions logged with `source: AI_INBOX`

**API routes** (5 new route files):
- `POST /api/projects/[id]/inbox` — Submit manual message + trigger LLM processing
- `GET /api/projects/[id]/inbox` — List messages (paginated, filterable by status)
- `GET/DELETE /api/projects/[id]/inbox/[msgId]` — Message detail + discard
- `PATCH /api/projects/[id]/inbox/[msgId]/actions/[actionId]` — Approve/reject single action
- `POST /api/projects/[id]/inbox/[msgId]/apply-all` — Bulk approve
- `POST /api/projects/[id]/inbox/[msgId]/reprocess` — Re-run LLM on failed messages

**UI** (4 new components):
- `InboxTab` — Filter chips (All/Pending/Applied/Rejected/Failed) + message list
- `InboxComposeDialog` — Submit Update modal with subject + textarea
- `InboxMessageCard` — Message card with sender info, classification/status badges, summary, action list, approve/reject all buttons
- `InboxActionItem` — Action with type icon, description, extracted data preview, individual approve/reject

**Page updates**:
- Dashboard: "Pending Reviews" stat card (5th card in stats row)
- Project detail: Inbox tab with pending count badge
- Activity feed: AI_INBOX source styled with purple icon
- Settings page added (was previously 404)

### Future enhancements (Inbox)

- [ ] Email webhook ingestion (SendGrid/Resend → parse "to" shortcode → create InboxMessage)
- [ ] SMS webhook ingestion (Twilio → resolve sender by phone)
- [ ] Async processing via job queue (Inngest/Trigger.dev) for webhook-triggered messages
- [ ] Per-project inbox settings UI (email address display, auto-apply toggle)
- [ ] Threaded conversations (email reply chain tracking with parentMessageId)

---

## Module 2: Metrics & Data Visualization

### Goal
Enable teams to track QI metrics over time with run charts and SPC control charts. Each project has `targetMetric`, `baselineValue`, and `goalValue` fields already in the schema.

### Planned scope

**Schema additions**:
- `MetricDataPoint` model: `{ id, projectId, metricName, value, recordedAt, notes }`
- `MetricDefinition` model: `{ id, projectId, name, unit, lowerBound, upperBound, target }`

**UI**:
- Metrics tab on project detail page
- Run chart (line chart of data points over time with goal line)
- SPC control chart (with UCL/LCL calculated from data)
- Data entry form (manual input + CSV import)
- Dashboard widget showing metric trends

**Technical approach**:
- Charts with a lightweight library (Recharts or Chart.js)
- Server Components for initial data load, client for interactive chart controls
- API routes for metric CRUD

### Hooks into Module 1
- `Project.targetMetric`, `baselineValue`, `goalValue` already exist
- Activity log will record metric data entry with `source: "MANUAL"`

---

## Module 3: Survey & Feedback Collection

### Goal
Allow QI teams to create and distribute surveys to patients/staff, collect responses, and view aggregate results.

### Planned scope

**Schema additions**:
- `Survey` model: `{ id, projectId, title, description, status, questions (JSON) }`
- `SurveyResponse` model: `{ id, surveyId, respondentEmail?, answers (JSON), submittedAt }`

**UI**:
- Survey builder (drag-and-drop question ordering)
- Public survey response page (no auth required)
- Survey results dashboard with aggregate charts
- Feedback tab on project detail page

### Hooks into Module 1
- Surveys linked to projects via `projectId`
- Activity log records survey creation/distribution

---

## Module 4: Report Generation

### Goal
Generate PDF reports summarizing QI project progress, metrics, and outcomes for stakeholders and accreditation.

### Planned scope
- Report template system (configurable sections)
- PDF generation (server-side, likely `@react-pdf/renderer` or Puppeteer)
- Include charts, tables, activity timeline
- Download and email distribution

### Hooks into Module 1
- Pulls data from projects, tasks, phases, activity logs
- Pulls metrics from Module 2, survey results from Module 3

---

## Module 5: AI Meeting Notes to Actions

### Goal
Process meeting transcripts (audio or text) and automatically extract action items, create tasks, and update project status.

### Planned scope

**Schema additions**:
- `Meeting` model: `{ id, projectId, title, date, transcript, summary, actionItems (JSON) }`

**Flow**:
1. User uploads meeting recording or pastes transcript
2. AI processes transcript → extracts summary + action items
3. User reviews extracted items
4. Confirmed items become tasks in the appropriate project phase
5. Activity logged with `source: "AI_MEETING"`

**Technical approach**:
- Claude API for transcript processing and action item extraction
- Structured output (JSON mode) for reliable parsing
- Human-in-the-loop review before task creation

### Hooks into Module 1
- Creates tasks via existing task API
- Logs activity with `source: "AI_MEETING"` and extracted data in `metadata`

---

## Module 6: AI Feedback Categorization

### Goal
Automatically categorize open-ended survey responses and feedback into themes, sentiment, and priority levels.

### Planned scope

**Flow**:
1. Feedback collected via Module 3 surveys or manual entry
2. AI categorizes responses by theme, sentiment, and urgency
3. Results displayed as categorized dashboard with theme clusters
4. High-priority feedback flagged for project team attention
5. Activity logged with `source: "AI_FEEDBACK"`

**Technical approach**:
- Claude API for text classification
- Batch processing of survey responses
- Theme extraction with confidence scores

### Hooks into Module 1
- Links to projects and surveys
- Logs categorization activity with `source: "AI_FEEDBACK"` and results in `metadata`

---

## Infrastructure Milestones

| Milestone | Priority | Description |
|-----------|----------|-------------|
| Deployment | High | Choose hosting (Vercel, Railway, or self-hosted) and set up CI/CD |
| Environment management | High | Proper env variable management for staging/production |
| Database hosting | High | Managed PostgreSQL (Neon, Supabase, or Railway Postgres) |
| Email service | Medium | For survey distribution and notifications (Resend or SendGrid) |
| File storage | Medium | For meeting recordings and report PDFs (S3 or Cloudflare R2) |
| Rate limiting | Medium | Protect API routes from abuse |
| Monitoring | Medium | Error tracking (Sentry) and analytics |
| Dark mode | Low | Theme toggle with `next-themes` (CSS variables already set up) |
| Mobile responsiveness | Low | Current layout is desktop-optimized |
| Internationalization | Low | Not needed for initial hospital deployment |
