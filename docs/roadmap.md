# Technical Roadmap

> **Version History**
> - **v0.1.0** (2026-02-28) — Module 1: Project Management Engine
> - **v0.1.1** (2026-03-01) — Module 1b: AI Inbox
> - **v0.1.2** (2026-03-01) — Module 1 Polish (loading states, error boundaries, filtering, pagination)
> - **v0.2.0** (2026-03-01) — Gantt Timeline View + Module 2: Metrics & Data Visualization
> - **v0.3.0** (2026-03-02) — Module 3: Survey & Feedback Collection

## Module Overview

| # | Module | Status | Version | Description |
|---|--------|--------|---------|-------------|
| 1 | Project Management Engine | **Complete** | v0.1.0 | Core project/task/phase management with Kanban, calendar, activity |
| 1b | AI Inbox | **Complete** | v0.1.1 | AI-powered inbox: paste updates → Claude extracts actions → human review → apply |
| 1c | Polish & UX | **Complete** | v0.1.2 | Loading skeletons, error boundaries, task filtering, pagination, inbox settings |
| 1d | Gantt Timeline | **Complete** | v0.2.0 | Read-only horizontal bar chart showing project phases/tasks over time |
| 2 | Metrics & Data Visualization | **Complete** | v0.2.0 | Run charts, SPC control charts, metric CRUD, data point tracking |
| 3 | Survey & Feedback Collection | **Complete** | v0.3.0 | Survey builder, public response page, aggregate results |
| 4 | Report Generation | Planned | — | PDF/export for QI project reports |
| 5 | AI Meeting Notes → Actions | Planned | — | Transcribe meetings, extract action items, create tasks |
| 6 | AI Feedback Categorization | Planned | — | Categorize open-ended survey responses with AI |

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

### Remaining polish (Module 1) — completed in v0.1.2 and v0.2.0

- [x] Loading skeletons (`loading.tsx`) for all route segments *(v0.1.2)*
- [x] Error boundaries (`error.tsx`) for all route segments *(v0.1.2)*
- [x] Settings page *(v0.1.0)*
- [x] Gantt/timeline view (read-only horizontal bar chart) *(v0.2.0)*
- [ ] Optimistic update rollback on API failure (Kanban board)
- [x] Task filtering and search within the Kanban board *(v0.1.2)*
- [x] Pagination on the global activity page *(v0.1.2)*
- [x] Empty state illustrations *(v0.1.2)*
- [x] Inbox settings (enable/disable, auto-apply toggle, shortcode) *(v0.1.2)*

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

## Gantt Timeline View (COMPLETE — v0.2.0)

### What was built

**Component**: `src/components/timeline/gantt-chart.tsx`

A read-only Gantt chart integrated as the "Timeline" tab on the project detail page:

- Pure CSS/HTML horizontal bar chart (no external charting library)
- Phase swimlanes with task bars nested underneath
- Phase bars: colored by status (green=COMPLETED, blue=IN_PROGRESS, gray=NOT_STARTED)
- Task bars: color-coded by status (slate=TODO, blue=IN_PROGRESS, emerald=DONE)
- Red dashed "today" marker line
- Auto-generated month headers from date range
- Tooltips on hover showing task details (status, assignee, due date)
- Empty state when no phase dates are set
- Uses existing `ProjectPhase.startDate/targetDate` and `Task.dueDate` fields — no schema changes needed for this feature

**Seed data updates**:
- Added `startDate`/`targetDate` to phase creation (staggered by ~30 days)
- Added `dueDate` values to all task creation calls

---

## Module 2: Metrics & Data Visualization (COMPLETE — v0.2.0)

### What was built

**Schema additions** (migration: `20260301113119_add_metrics`):
- `MetricDefinition` model: `{ id, projectId, name, unit, lowerBound, upperBound, target, createdAt, updatedAt }`
- `MetricDataPoint` model: `{ id, metricId, value, recordedAt, notes, recordedById, createdAt }`
- Relations: `Project.metrics`, `User.recordedDataPoints`

**Validation schemas** (`src/lib/validations/metric.ts`):
- `createMetricSchema` — name (required), unit, target, lowerBound, upperBound
- `updateMetricSchema` — partial of create schema
- `addDataPointSchema` — value (number), recordedAt (datetime), notes

**API routes** (4 new route files):
- `GET /api/projects/[id]/metrics` — List all metrics with data points
- `POST /api/projects/[id]/metrics` — Create metric definition (DIRECTOR/LEAD)
- `GET/PATCH/DELETE /api/projects/[id]/metrics/[mId]` — Metric CRUD (DIRECTOR/LEAD for writes)
- `POST /api/projects/[id]/metrics/[mId]/data-points` — Add data point (DIRECTOR/LEAD/MEMBER)
- `DELETE /api/projects/[id]/metrics/[mId]/data-points/[dpId]` — Remove data point (DIRECTOR/LEAD)

**UI components** (7 new files under `src/components/metrics/`):
- `MetricsTab` — top-level container with metric card grid and state management
- `MetricCard` — summary card with inline SVG sparkline, latest value, trend indicator
- `MetricDetailSheet` — slide-over sheet with full chart, data table, inline edit
- `RunChart` — Recharts line chart with median and target reference lines
- `SPCChart` — Recharts SPC chart with UCL/LCL/center lines, out-of-control highlighting
- `CreateMetricDialog` — dialog form for new metric definitions
- `AddDataPointForm` — inline form for recording new measurements

**Page integration**:
- Project detail page: Metrics tab (with BarChart3 icon) added to tab list
- Activity feed: `METRIC_CREATED`, `METRIC_UPDATED`, `METRIC_DELETED`, `DATA_POINT_ADDED` icons

**Seed data**:
- 3 sample metrics: CAUTI Rate (7 data points, declining), Bundle Compliance (7 points, rising), Average Discharge Time (4 points, declining)

### Hooks into Module 1
- `Project.targetMetric`, `baselineValue`, `goalValue` displayed on project header
- Activity log records metric operations with `source: "SYSTEM"`
- Permissions use existing two-tier RBAC (system roles + project roles)

### Future enhancements (Metrics)

- [ ] CSV data import
- [ ] Dashboard widget showing metric trends across projects
- [ ] Metric-level annotations (mark interventions on the chart timeline)
- [ ] Automated SPC rule detection (Nelson rules, Western Electric rules)
- [ ] Export charts as PNG/PDF

---

## Module 3: Survey & Feedback Collection (COMPLETE — v0.3.0)

### What was built

**Schema additions** (migration: `20260302014354_add_surveys`):
- 2 new enums: `SurveyStatus` (DRAFT, PUBLISHED, CLOSED), `QuestionType` (TEXT, RATING, MULTIPLE_CHOICE, YES_NO, LIKERT_SCALE)
- `Survey` model: `{ id, projectId, createdById, title, description, status, publishedAt, closedAt }`
- `SurveyQuestion` model: `{ id, surveyId, text, type, required, options (JSON), orderIndex }`
- `SurveyResponse` model: `{ id, surveyId, respondentName, submittedAt }`
- `SurveyAnswer` model: `{ id, responseId, questionId, value }`
- Relations: `Project.surveys`, `User.createdSurveys`

**Validation schemas** (`src/lib/validations/survey.ts`):
- `createSurveySchema` — title, description, optional inline questions array
- `updateSurveySchema` — partial title/description (DRAFT only)
- `addQuestionSchema` / `updateQuestionSchema` — question text, type, required, options
- `submitResponseSchema` — respondentName (optional), answers array

**API routes** (8 authenticated + 1 public):
- `GET/POST /api/projects/[id]/surveys` — List surveys + Create with inline questions (DIRECTOR/LEAD)
- `GET/PATCH/DELETE /api/projects/[id]/surveys/[sId]` — Survey CRUD (PATCH/DELETE for DRAFT only)
- `POST /api/projects/[id]/surveys/[sId]/publish` — Publish (validates ≥1 question)
- `POST /api/projects/[id]/surveys/[sId]/close` — Close (PUBLISHED → CLOSED)
- `GET/POST /api/projects/[id]/surveys/[sId]/questions` — Question CRUD (DRAFT only)
- `PATCH/DELETE /api/projects/[id]/surveys/[sId]/questions/[qId]` — Edit/delete questions
- `GET /api/projects/[id]/surveys/[sId]/responses` — List responses with answers
- `GET/POST /api/surveys/[sId]/respond` — **Public** (no auth) — fetch survey + submit response

**Public survey page** (`(public)` route group):
- `src/app/(public)/layout.tsx` — Minimal layout (no sidebar/header)
- `src/app/(public)/surveys/[surveyId]/page.tsx` — Server Component renders `PublicSurveyForm`

**UI components** (8 new files under `src/components/surveys/`):
- `SurveysTab` — top-level container with survey card grid and state management
- `SurveyCard` — summary card with title, status, question count, response count
- `SurveyStatusBadge` — color-coded badge (gray=DRAFT, green=PUBLISHED, slate=CLOSED)
- `CreateSurveyDialog` — multi-question survey builder with `QuestionFormItem` components
- `SurveyDetailSheet` — slide-over with questions/results toggle, public link, publish/close/delete actions
- `SurveyResultsView` — per-question aggregate charts (Recharts bar charts, dynamically imported)
- `QuestionFormItem` — reusable question row (type dropdown, text input, options builder, required toggle)
- `PublicSurveyForm` — renders 5 question types (text, rating, yes/no, multiple choice, likert) + success state

**Page integration**:
- Project detail page: Surveys tab (with ClipboardList icon) added as 6th tab
- Activity feed: 6 new survey action icons (`SURVEY_CREATED`, `SURVEY_PUBLISHED`, `SURVEY_CLOSED`, `SURVEY_DELETED`, `SURVEY_UPDATED`, `SURVEY_RESPONSE_RECEIVED`)

**Seed data**:
- "Patient Discharge Experience Survey" (PUBLISHED, 5 questions, 8 responses with answers)
- "ICU Nurse CAUTI Bundle Assessment" (DRAFT, 3 questions, 0 responses)

### Hooks into Module 1
- Surveys linked to projects via `projectId`
- Activity log records survey creation/distribution/responses with `source: "SYSTEM"`
- Permissions use existing two-tier RBAC (DIRECTOR/LEAD can create/publish/close)
- Checkbox shadcn/ui component added (20 components total)

### Future enhancements (Surveys)

- [ ] Survey templates (reusable question sets)
- [ ] Email distribution (send survey link to respondent list)
- [ ] Response export (CSV download)
- [ ] Conditional logic (skip questions based on previous answers)
- [ ] AI categorization of free-text responses (Module 6 integration)

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
