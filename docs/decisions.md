# Architectural Decision Records (ADRs)

> **Version History**
> - **v0.1.0** (2026-02-28) — ADR-001 through ADR-009
> - **v0.1.1** (2026-03-01) — ADR-010, ADR-011 (AI Inbox)
> - **v0.2.0** (2026-03-01) — ADR-012 through ADR-014 (Gantt Timeline, Recharts, Metrics Permissions)

## ADR-001: Next.js App Router with Server Components

**Date**: 2026-02-28
**Status**: Accepted

### Context
We needed a React framework that supports both server-rendered pages (for SEO and performance) and rich client interactivity (for the Kanban board). The app is data-heavy with many database reads.

### Decision
Use Next.js 16 with the App Router and React Server Components as the default rendering strategy.

### Rationale
- **Server Components by default** eliminate API round-trips for data reads — pages query Prisma directly
- **Route groups** cleanly separate auth pages (no sidebar) from dashboard pages (with sidebar)
- **Parallel data fetching** via `Promise.all` in Server Components (e.g., the dashboard runs 6 queries concurrently)
- **Turbopack** provides fast dev server HMR
- App Router is the recommended path for new Next.js projects

### Consequences
- Client Components require explicit `'use client'` directive
- Cannot use React context or hooks in Server Components
- Mutations must go through API Route Handlers (not server actions — we chose explicit routes for clarity)

---

## ADR-002: Prisma 7 with Driver Adapter Pattern

**Date**: 2026-02-28
**Status**: Accepted

### Context
Prisma 7 changed the client initialization pattern. The traditional `new PrismaClient()` no longer works without a driver adapter. We needed an ORM that provides type-safe queries and a good migration story.

### Decision
Use Prisma 7 with `@prisma/adapter-pg` (the PostgreSQL driver adapter) and the new `prisma-client` generator.

### Rationale
- Type-safe database queries with full autocomplete
- Schema-first approach with declarative migrations
- The driver adapter pattern gives direct control over the connection
- `@@map()` / `@map()` allow snake_case DB conventions with camelCase TypeScript

### Consequences
- Must import from `@/generated/prisma/client` and `@/generated/prisma/enums` (no index file)
- Requires `prisma.config.ts` for env loading
- `PrismaClient` constructor requires `{ adapter }` argument — no zero-arg constructor
- Singleton pattern needed for Next.js hot-reload safety

### Alternatives Considered
- **Drizzle ORM**: Lighter weight but less mature migration tooling
- **Raw SQL / pg**: Maximum control but no type safety or migration management

---

## ADR-003: NextAuth v5 with JWT Strategy

**Date**: 2026-02-28
**Status**: Accepted

### Context
The app needs authentication with role-based access control. We have four system roles (DIRECTOR, PROJECT_LEAD, TEAM_MEMBER, VIEWER) that must be available on every request without a database lookup.

### Decision
Use NextAuth v5 (beta) with the Credentials provider and JWT session strategy.

### Rationale
- JWT strategy embeds `id`, `role`, and `department` in the token — no DB query per request
- Credentials provider allows email/password auth against our own user table
- `auth()` function works in both Server Components and API routes
- Type augmentation puts role info on `session.user` with full TypeScript support

### Consequences
- JWT tokens are stateless — revoking a session requires token expiry or a blocklist (not implemented)
- Credentials provider does not support OAuth flows (acceptable for V1 — hospital intranet use case)
- Using beta version (v5) — API may change before stable release

### Alternatives Considered
- **Lucia Auth**: Simpler but less ecosystem support
- **Custom JWT**: Full control but reinventing the wheel
- **Database sessions**: More secure revocation but adds a DB query per request

---

## ADR-004: @dnd-kit for Kanban Drag-and-Drop

**Date**: 2026-02-28
**Status**: Accepted

### Context
The Kanban board requires drag-and-drop for reordering tasks within phases and moving tasks between phases. We needed a library compatible with React 18/19 that handles accessible keyboard navigation.

### Decision
Use `@dnd-kit/core` + `@dnd-kit/sortable` for all drag-and-drop interactions.

### Rationale
- Actively maintained with React 18+ support
- Built-in accessibility (keyboard sensors, screen reader announcements)
- `closestCorners` collision detection works well for multi-column Kanban layouts
- `PointerSensor` with `distance: 8` prevents accidental drags when clicking
- `DragOverlay` provides smooth ghost card during drag

### Consequences
- Optimistic UI — local state updates immediately, API call follows
- Batch reorder endpoint (`PUT /api/tasks/reorder`) needed for persisting order after drag
- Two distinct operations: reorder within a phase (orderIndex changes) and move between phases (projectPhaseId + orderIndex changes)

### Alternatives Considered
- **react-beautiful-dnd**: Deprecated, not compatible with React 18+
- **react-dnd**: Lower-level API, more setup required
- **Native drag events**: No accessibility support

---

## ADR-005: Two-Tier Role Model

**Date**: 2026-02-28
**Status**: Accepted

### Context
Healthcare QI teams have organization-wide roles (QI Director oversees everything) and project-specific roles (a nurse may lead one project but just be a stakeholder on another).

### Decision
Implement a two-tier authorization model:
1. **System roles** on the User model: DIRECTOR, PROJECT_LEAD, TEAM_MEMBER, VIEWER
2. **Project roles** on the ProjectMember model: LEAD, MEMBER, STAKEHOLDER

### Rationale
- DIRECTOR has global access — bypasses all project-level checks
- Other users only see projects they're members of
- Project roles control fine-grained permissions (who can edit tasks, manage members, etc.)
- Numeric level maps (`SYSTEM_ROLE_LEVEL`, `PROJECT_ROLE_LEVEL`) enable simple `>=` comparisons

### Consequences
- Every project query for non-directors must filter by membership
- `requireProjectAccess()` is the central authorization check for project-scoped operations
- Adding a user to a project requires explicit `ProjectMember` creation

---

## ADR-006: Methodology-Driven Phase Templates

**Date**: 2026-02-28
**Status**: Accepted

### Context
QI projects follow specific methodologies (DMAIC, PDSA, LEAN) where each methodology has a defined set of phases. Users should not have to manually create phases.

### Decision
When a project is created, auto-generate `ProjectPhase` records from the `METHODOLOGY_PHASES` lookup table in `constants.ts`.

### Rationale
- Ensures correct phase structure for every project
- Phases serve as Kanban board columns — always present on creation
- `orderIndex` preserves phase ordering
- The methodology is stored on the project, and phases are stored as separate records, allowing future customization (adding/removing phases)

### Consequences
- Phase structure is immutable after creation in V1 (no add/remove/reorder phases UI yet)
- Changing methodology on an existing project does not regenerate phases
- All tasks belong to exactly one phase

---

## ADR-007: Activity Log with Source Enum for Module Extensibility

**Date**: 2026-02-28
**Status**: Accepted

### Context
We need an audit trail for all project mutations. Future modules (AI Meeting Notes, AI Feedback Categorization) will also generate activity entries.

### Decision
The `ActivityLog` model includes a `source` enum (`MANUAL | AI_MEETING | AI_FEEDBACK | SYSTEM`) and a `metadata` JSON field for structured data.

### Rationale
- Every mutation in Module 1 logs with `source: "SYSTEM"`
- Future Module 5 (Meeting AI) will log with `source: "AI_MEETING"` and store parsed action items in `metadata`
- Future Module 6 (Feedback AI) will log with `source: "AI_FEEDBACK"` and store categorization results in `metadata`
- The activity feed UI can filter or style entries differently based on source

### Consequences
- `metadata` is untyped JSON — schema enforcement is at the application layer
- Activity feed must handle variable metadata shapes
- The `action` field is a free-form string (e.g., "TASK_COMPLETED") rather than an enum, for extensibility

---

## ADR-008: Tailwind v4 with shadcn/ui

**Date**: 2026-02-28
**Status**: Accepted

### Context
We needed a consistent, professional UI with minimal custom CSS. The design should feel like Monday.com or Linear — clean, light, and data-dense.

### Decision
Use Tailwind CSS v4 with shadcn/ui components (New York style, Zinc base).

### Rationale
- Tailwind v4's new `@theme inline` blocks keep all design tokens in CSS
- shadcn/ui provides high-quality, customizable primitives (19 components installed)
- Components are copied into the project (not a dependency) — full control
- oklch color space enables perceptually uniform color adjustments

### Consequences
- No `tailwind.config.ts` — all configuration lives in `globals.css`
- Must use `@import "tailwindcss"` syntax (not the v3 `@tailwind` directives)
- QI green primary (`oklch(0.44 0.1 160)`) overrides shadcn's default zinc primary
- Light theme only (no dark mode support in V1)

---

## ADR-009: Server Actions vs API Routes for Mutations

**Date**: 2026-02-28
**Status**: Accepted (API Routes chosen)

### Context
Next.js App Router supports both Server Actions and API Route Handlers for mutations. We needed to decide which pattern to use.

### Decision
Use API Route Handlers (`src/app/api/`) for all mutations.

### Rationale
- Explicit HTTP endpoints are easier to test and debug
- Clear separation between reads (Server Components) and writes (API routes)
- API routes can be consumed by future mobile apps or external integrations
- Zod validation at the route level provides consistent error handling
- Activity logging is centralized in route handlers

### Consequences
- Client components must use `fetch()` for mutations (slightly more boilerplate than Server Actions)
- No progressive enhancement (forms don't work without JavaScript)
- Router cache must be manually invalidated after mutations (`router.refresh()`)

### Alternatives Considered
- **Server Actions**: Less boilerplate, but harder to reuse outside Next.js and less explicit about HTTP semantics

---

## ADR-010: Claude tool_use for Inbox Message Processing

**Date**: 2026-03-01
**Status**: Accepted

### Context
The AI Inbox feature processes free-text messages (meeting notes, status updates, observations) into structured project actions. We need reliable, type-safe structured output from the LLM to create tasks, update statuses, and log notes.

### Decision
Use Claude's **tool_use** feature with a strict JSON schema tool definition (`process_inbox_message`) to guarantee valid structured output. Model: `claude-sonnet-4-20250514`.

### Rationale
- `tool_use` with `tool_choice: { type: "tool", name: "..." }` guarantees the model returns valid JSON matching the schema — no regex/JSON.parse failures
- The tool schema defines `classification`, `summary`, and an `actions[]` array with typed action data
- Sonnet is fast and cost-effective for structured extraction tasks
- The `@anthropic-ai/sdk` provides a clean TypeScript API with proper error handling

### Consequences
- Requires `ANTHROPIC_API_KEY` environment variable
- Each inbox submission makes one synchronous Claude API call (adds 2-5s latency)
- LLM responses are stored in `InboxMessage.llmResponse` (JSON) for auditability
- Future: webhook-triggered messages should use async job queues to avoid blocking

### Alternatives Considered
- **JSON mode / system prompt only**: Less reliable structure — model can return invalid shapes
- **OpenAI function calling**: Similar approach but we're using Claude for the whole platform
- **Local LLM (Ollama)**: No API cost but requires infrastructure and lower quality extraction

---

## ADR-011: Review-First Inbox with Opt-In Auto-Apply

**Date**: 2026-03-01
**Status**: Accepted

### Context
The inbox extracts actions from free-text messages. In a healthcare setting, automatically applying AI-extracted actions without human review could lead to incorrect task creation or data modifications.

### Decision
Default to **review-first**: all extracted actions have status `PENDING` and require explicit human approval. Projects can opt in to `inboxAutoApply` for immediate application.

### Rationale
- Healthcare context demands human oversight of AI-generated changes
- Prevents incorrect task creation from ambiguous messages
- Allows project leads to reject irrelevant or incorrect extractions
- Auto-apply option available for trusted, high-volume workflows
- Individual action approval/rejection gives fine-grained control

### Consequences
- Extra step for users (must review and approve actions)
- Pending review count shown on dashboard and project inbox tab to surface unreviewed items
- Only LEAD or DIRECTOR roles can approve/reject actions

---

## ADR-012: Pure CSS/HTML Gantt Chart

**Date**: 2026-03-01
**Status**: Accepted
**Version**: v0.2.0

### Context
The project detail page needed a timeline/Gantt view to visualize phase and task schedules. We could use a dedicated Gantt library (e.g., dhtmlxGantt, Bryntum) or build a custom solution.

### Decision
Build a custom Gantt chart using pure CSS/HTML with absolute-positioned `div` elements and percentage-based widths. No charting library.

### Rationale
- Gantt libraries are typically heavy (100KB+) and opinionated about styling — hard to match our design system
- Our Gantt is read-only (no drag-to-resize, no dependency arrows) — a simple horizontal bar layout suffices
- CSS `position: absolute` with percentage `left`/`width` maps naturally to date ranges
- `date-fns` (already installed) handles all date math (differenceInDays, startOfMonth, etc.)
- Full control over colors, tooltips, and responsive behavior via Tailwind classes
- Zero bundle size impact beyond the component itself

### Consequences
- No built-in task dependency arrows (acceptable for V1 — QI projects track phases sequentially)
- No drag-to-resize or interactive scheduling (read-only view)
- Manual calculation of bar positions based on date ranges
- Requires fallback handling when phases/tasks have no dates set

### Alternatives Considered
- **Recharts (horizontal bar)**: Possible but Recharts isn't designed for timeline/Gantt layouts
- **dhtmlxGantt / Bryntum**: Feature-rich but expensive licenses and heavy bundles
- **vis-timeline**: Open source but dated API and hard to customize

---

## ADR-013: Recharts for Metrics Charting

**Date**: 2026-03-01
**Status**: Accepted
**Version**: v0.2.0

### Context
Module 2 (Metrics) requires run charts and SPC control charts. We needed a React-native charting library that supports line charts, reference lines (for control limits), and custom dot rendering.

### Decision
Use **Recharts** for all metrics charting. Components are dynamically imported with `next/dynamic` + `ssr: false`.

### Rationale
- React-native API — charts are composed from JSX components (`<LineChart>`, `<ReferenceLine>`, `<Tooltip>`)
- Built-in `ReferenceLine` component maps directly to SPC control limits (UCL/LCL/center line) and target values
- Custom `dot` render prop enables out-of-control point highlighting (red dots for values beyond limits)
- `ResponsiveContainer` handles chart resizing without manual resize observers
- Lightweight enough (~45KB gzipped) compared to full dashboard libraries
- Active maintenance with good React 18+ support

### Consequences
- Must use `next/dynamic` with `ssr: false` — Recharts uses browser APIs (canvas/SVG measurement) that fail in Node.js
- Tooltip `formatter` types are loose — need to avoid explicit TypeScript annotations to prevent type errors
- No built-in statistical calculations (mean, std dev, median) — calculated in application code via `useMemo`
- Chart data must be serialized (ISO strings from server → `date-fns` format in client)

### Alternatives Considered
- **Chart.js (react-chartjs-2)**: More widely used but imperative API doesn't compose well with React
- **D3**: Maximum flexibility but very low-level — massive development effort for standard charts
- **Nivo**: Beautiful defaults but less control over individual chart elements like reference lines
- **Tremor**: High-level dashboarding library but opinionated styling that conflicts with our design system

---

## ADR-014: Three-Tier Metrics Permissions

**Date**: 2026-03-01
**Status**: Accepted
**Version**: v0.2.0

### Context
Metrics data integrity is critical in healthcare QI. We needed to decide who can define metrics, who can add data, and who can only view.

### Decision
Implement three permission tiers for metrics operations:
1. **View**: any project member (including STAKEHOLDER)
2. **Add data points**: DIRECTOR, project LEAD, or project MEMBER
3. **Create/edit/delete metrics + delete data points**: DIRECTOR or project LEAD only

### Rationale
- STAKEHOLDER role is view-only — they can see metric trends but not contribute data (prevents accidental/invalid entries)
- MEMBER role can add data points — frontline staff collecting measurements (e.g., nurses recording CAUTI rates)
- LEAD/DIRECTOR control metric definitions to maintain consistency (naming, units, control limits)
- Deleting data points requires LEAD+ because it changes historical records
- Aligns with existing two-tier RBAC pattern — no new role types needed

### Consequences
- UI conditionally renders "Add Metric", "Edit", and "Add Data" buttons based on permission props
- API routes check both system role and project membership role
- The `canEdit` and `canAddData` booleans are computed server-side and passed as props to client components
