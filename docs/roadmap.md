# Technical Roadmap

> **Version History**
> - **v0.1.0** (2026-02-28) — Module 1: Project Management Engine
> - **v0.1.1** (2026-03-01) — Module 1b: AI Inbox
> - **v0.1.2** (2026-03-01) — Module 1 Polish (loading states, error boundaries, filtering, pagination)
> - **v0.2.0** (2026-03-01) — Gantt Timeline View + Module 2: Metrics & Data Visualization
> - **v0.3.0** (2026-03-02) — Module 3: Survey & Feedback Collection
> - **v0.4.0** (2026-03-02) — Module 5: AI Meeting Notes → Actions
> - **v0.5.0** (2026-03-02) — Module 5b: Project Groups (Committees) + Group-Level AI Meetings
> - **v0.5.1** (2026-03-02) — Railway deployment configuration
> - **v0.5.2** (2026-03-05) — UX polish: My Tasks page, tutorial, clickable stats, methodology switching, AI error handling

## Module Overview

| # | Module | Status | Version | Description |
|---|--------|--------|---------|-------------|
| 1 | Project Management Engine | **Complete** | v0.1.0 | Core project/task/phase management with Kanban, calendar, activity |
| 1b | AI Inbox | **Complete** | v0.1.1 | AI-powered inbox: paste updates → Claude extracts actions → human review → apply |
| 1c | Polish & UX | **Complete** | v0.1.2 | Loading skeletons, error boundaries, task filtering, pagination, inbox settings |
| 1d | Gantt Timeline | **Complete** | v0.2.0 | Read-only horizontal bar chart showing project phases/tasks over time |
| 1e | UX Polish & Navigation | **Complete** | v0.5.2 | Clickable dashboard stats, My Tasks page, tutorial, methodology switching, AI error handling, dialog overflow fixes |
| 2 | Metrics & Data Visualization | **Complete** | v0.2.0 | Run charts, SPC control charts, metric CRUD, data point tracking |
| 3 | Survey & Feedback Collection | **Complete** | v0.3.0 | Survey builder, public response page, aggregate results |
| 4 | Report Generation | Planned | — | PDF/export for QI project reports |
| 5 | AI Meeting Notes → Actions | **Complete** | v0.4.0 | Paste meeting notes → Claude extracts actions/summary/decisions → human review → apply |
| 5b | Project Groups (Committees) | **Complete** | v0.5.0 | Committee grouping of projects, group membership/roles, group-level AI meeting notes with multi-project action routing |
| 6 | AI Feedback Categorization | Planned | — | Categorize open-ended survey responses with AI |
| — | Railway Deployment | **Complete** | v0.5.1 | Production deployment config, health check endpoint, standalone build |

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

## Module 5: AI Meeting Notes → Actions (COMPLETE — v0.4.0)

### What was built

**Schema additions** (migration: `20260302151725_add_meeting_notes`):
- 3 new enums: `MeetingNoteStatus` (RECEIVED, PROCESSING, REVIEWED, APPLIED, REJECTED, FAILED), `MeetingActionType` (CREATE_TASK, UPDATE_TASK, COMPLETE_TASK, ADD_NOTE, STATUS_UPDATE), `MeetingActionStatus` (PENDING, APPROVED, REJECTED, FAILED)
- `MeetingNote` model: `{ id, projectId, submittedById, status, title, meetingDate, attendees, duration, rawTranscript, processedSummary, keyDecisions (JSON), llmResponse (JSON), errorMessage }`
- `MeetingAction` model: `{ id, meetingNoteId, actionType, status, description, extractedData (JSON), appliedData (JSON), targetTaskId, createdTaskId }`
- Relations: `User.submittedMeetingNotes`, `Project.meetingNotes`

**Processing pipeline** (`src/lib/meeting-processor.ts`):
- Claude API integration using **tool_use** for guaranteed structured JSON output (mirrors inbox-processor pattern)
- System prompt tailored for healthcare QI meeting context
- Extracts meeting summary (3-5 sentences), key decisions (bulleted), and actionable items
- 5 action types: CREATE_TASK, UPDATE_TASK, COMPLETE_TASK, ADD_NOTE, STATUS_UPDATE
- Model: `claude-sonnet-4-20250514` (same as inbox)

**Shared resolvers** (`src/lib/action-resolvers.ts`):
- Extracted from `inbox-actions.ts` to enable code reuse between inbox and meeting pipelines
- `resolvePhase()`, `resolveAssignee()`, `resolveTask()` — fuzzy name matching helpers
- `ExtractedData` interface shared across both modules

**Action application** (`src/lib/meeting-actions.ts`):
- `applyMeetingAction()` — same action type switch as inbox, logs with `source: AI_MEETING`
- `rejectMeetingAction()`, `applyAllPendingMeetingActions()`, `rejectAllPendingMeetingActions()`

**API routes** (5 new route files):
- `POST /api/projects/[id]/meetings` — Submit meeting notes + trigger Claude processing
- `GET /api/projects/[id]/meetings` — List meetings (paginated, filterable by status)
- `GET/DELETE /api/projects/[id]/meetings/[mId]` — Meeting detail + discard (LEAD/DIRECTOR)
- `PATCH /api/projects/[id]/meetings/[mId]/actions/[aId]` — Approve/reject single action
- `POST /api/projects/[id]/meetings/[mId]/apply-all` — Bulk approve all pending
- `POST /api/projects/[id]/meetings/[mId]/reprocess` — Re-run Claude on meeting note

**UI** (4 new components under `src/components/meetings/`):
- `MeetingsTab` — Filter chips (All/Pending/Applied/Rejected/Failed) + meeting note list
- `MeetingComposeDialog` — Submit Meeting Notes dialog with title, date, attendees, duration, transcript
- `MeetingNoteCard` — Card with submitter info, status badges, AI summary, key decisions, action list, expandable transcript
- `MeetingActionItem` — Action with type icon, description, extracted data preview, approve/reject buttons

**Page integration**:
- Project detail: Meetings tab (7th tab) with NotebookText icon + pending count badge
- Activity feed: `MEETING_PROCESSED` icon with purple color for AI_MEETING source

**Seed data**:
- "Weekly CAUTI Huddle" (REVIEWED, 3 PENDING actions)
- "Discharge Process Review" (APPLIED, 2 APPROVED actions)

### Hooks into Module 1
- Creates/updates tasks via shared action resolvers
- Logs activity with `source: "AI_MEETING"` and extracted data in `metadata`
- Permissions use existing two-tier RBAC (LEAD/DIRECTOR for approve/reject/delete)

### Future enhancements (Meetings)

- [ ] Audio file upload + transcription (Whisper API or AssemblyAI)
- [ ] Auto-detection of attendees from transcript
- [ ] Meeting templates (standup, retrospective, huddle)
- [ ] Meeting series (recurring meetings linked together)
- [ ] Integration with calendar for auto-scheduling follow-ups

---

## Module 5b: Project Groups / Committees (COMPLETE — v0.5.0)

### What was built

**Schema additions** (migration: `20260302170137_add_project_groups`):
- 2 new enums: `GroupMemberRole` (CHAIR, SECRETARY, MEMBER), `GroupStatus` (ACTIVE, INACTIVE)
- `ProjectGroup` model: `{ id, name, description, department, status, createdById }`
- `GroupMember` model: `{ id, groupId, userId, role, joinedAt }` (unique on groupId+userId)
- `ProjectGroupLink` model: `{ id, groupId, projectId, addedAt }` (unique on groupId+projectId, many-to-many join)
- `MeetingNote` modified: `projectId` now optional, added `groupId` (XOR enforced at app layer)
- `MeetingAction` modified: added `targetProjectId` for routing group-level actions to specific projects

**Group-level AI meeting processing** (`src/lib/meeting-processor.ts`):
- New `PROCESS_GROUP_MEETING_TOOL` Claude tool schema — each action requires `targetProjectTitle`
- `processGroupMeetingNote()` builds multi-project context, calls Claude, resolves titles to project IDs
- `resolveProjectByTitle()` in `action-resolvers.ts` — exact match → partial/contains match → null
- `meeting-actions.ts` updated: `targetProjectId || meetingNote.projectId` fallback (backward-compatible)

**API routes** (11 new route files):
- Group CRUD: `/api/groups` (GET/POST), `/api/groups/[gId]` (GET/PATCH/DELETE)
- Group members: `/api/groups/[gId]/members` (GET/POST), `/api/groups/[gId]/members/[mId]` (PATCH/DELETE)
- Group projects: `/api/groups/[gId]/projects` (GET/POST), `/api/groups/[gId]/projects/[pId]` (DELETE)
- Group meetings: `/api/groups/[gId]/meetings` (GET/POST), `/api/groups/[gId]/meetings/[mId]` (GET/DELETE)
- Group meeting actions: `.../actions/[aId]` (PATCH), `.../apply-all` (POST), `.../reprocess` (POST)

**UI components** (6 new files under `src/components/groups/`):
- `GroupCard` — card with name, description, member count, project count, role badge
- `CreateGroupDialog` — create committee with name, description, department
- `GroupMembersSection` — member list with role badges, add member dialog with user search
- `AddGroupProjectDialog` — link existing project with searchable project list
- `GroupMeetingsTab` — meeting notes list with filter chips and compose dialog (group-level)
- `GroupMeetingComposeDialog` — submit meeting notes that AI routes to correct projects

**Pages**:
- `/groups` — committees list with card grid, create button (PROJECT_LEAD+)
- `/groups/[groupId]` — detail with Projects tab (linked projects grid + members section) and Meetings tab

**Navigation updates**:
- Sidebar: "Committees" top-level nav link + collapsible "My Committees" section
- Dashboard layout fetches user's groups, passes to Sidebar

**Existing component updates**:
- `MeetingNoteCard` — added `groupId` + `projectMap` props, API path switching
- `MeetingActionItem` — added `targetProjectName` badge for group meeting actions

**Seed data**:
- "Perioperative Quality Committee" (ACTIVE, 3 members, 2 linked projects)
- Group meeting: "Monthly Periop Committee Meeting" (REVIEWED, 3 PENDING actions targeting 2 different projects)

### Hooks into Module 1 & 5
- Uses existing ProjectCard for linked project display
- Group meeting actions apply to projects via shared action resolvers
- Three-tier RBAC: system roles + project roles + group roles
- `requireGroupAccess()` follows same pattern as `requireProjectAccess()`

### Future enhancements (Groups)

- [ ] Group-level aggregated dashboard (metrics across all projects)
- [ ] Cross-group project comparison views
- [ ] Group activity feed (aggregate activity from all linked projects)
- [ ] Group-level reports (pull from all projects in the group)
- [ ] Recurring committee meeting schedule

---

## UX Polish & Navigation (COMPLETE — v0.5.2)

### What was built

**New pages**:
- **My Tasks** (`/tasks`) — Dedicated page showing all tasks assigned to the current user with three filter tabs: All Tasks, Due This Week, and Overdue
- **Tutorial** (`/tutorial`) — Getting Started guide with step-by-step instructions for new users

**Dashboard improvements**:
- Clickable stat cards — each dashboard stat card links to the relevant filtered view (Active Projects → `/projects`, Open Tasks → `/tasks`, Due This Week → `/tasks?tab=week`, Completed This Month → `/tasks`, Pending Reviews → first project inbox)
- Improved spacing and layout consistency

**Project management improvements**:
- **Methodology Switcher** — Change a project's QI methodology after creation with confirmation dialog (warns about phase regeneration)
- **Committee project removal** — Chairs can unlink projects from committees via the group detail page using `GroupProjectCard` component

**Header branding** — Updated header component with application branding

**AI error handling improvements** *(v0.5.2)*:
- Classified Anthropic SDK errors (`AuthenticationError`, `RateLimitError`, `APIConnectionError`) in inbox and meeting processors for user-friendly error messages
- API key guard in `ai.ts` — warns when `ANTHROPIC_API_KEY` is not set
- Dialog overflow fix — compose dialogs (inbox, meeting, group meeting) now have `max-h-[85vh] overflow-y-auto` on `DialogContent` and `max-h-[40vh]` cap on textareas
- Toast feedback — compose dialogs check `data.status === "FAILED"` and show `toast.error` with the actual error message instead of false success

**Sidebar navigation updates**:
- Added "My Tasks" link
- Added "Tutorial" link

### Files added/modified

| File | Change |
|------|--------|
| `src/app/(dashboard)/tasks/page.tsx` | New — My Tasks server page |
| `src/app/(dashboard)/tasks/tabs.tsx` | New — My Tasks client tabs component |
| `src/app/(dashboard)/tutorial/page.tsx` | New — Tutorial page |
| `src/app/(dashboard)/page.tsx` | Updated — clickable stat cards |
| `src/components/projects/methodology-switcher.tsx` | New — methodology change dialog |
| `src/components/groups/group-project-card.tsx` | New — committee project card with unlink |
| `src/components/layout/sidebar.tsx` | Updated — My Tasks + Tutorial nav links |
| `src/components/layout/header.tsx` | Updated — branding |
| `src/app/api/projects/[projectId]/route.ts` | Updated — methodology PATCH with phase regeneration |
| `src/lib/ai.ts` | Updated — API key guard with warning |
| `src/lib/inbox-processor.ts` | Updated — classified SDK error handling |
| `src/lib/meeting-processor.ts` | Updated — classified SDK error handling (both catch blocks) |
| `src/components/inbox/inbox-compose-dialog.tsx` | Updated — overflow fix + failure toast |
| `src/components/meetings/meeting-compose-dialog.tsx` | Updated — overflow fix + failure toast |
| `src/components/groups/group-meeting-compose-dialog.tsx` | Updated — overflow fix + failure toast |

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
