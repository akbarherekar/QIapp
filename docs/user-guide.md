# QIapp User Guide

A step-by-step guide for using QIapp — a healthcare Quality Improvement platform for managing QI projects, tracking metrics, and processing team updates with AI.

> **Version**: v0.4.0 (2026-03-02)
> This guide covers all features through the AI Meeting Notes module.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Projects](#3-projects)
4. [Kanban Board](#4-kanban-board)
5. [AI Inbox](#5-ai-inbox)
6. [Timeline (Gantt Chart)](#6-timeline-gantt-chart)
7. [Metrics & Charts](#7-metrics--charts)
8. [Surveys & Feedback](#8-surveys--feedback)
9. [AI Meeting Notes](#9-ai-meeting-notes)
10. [Activity Feed](#10-activity-feed)
11. [Calendar](#11-calendar)
12. [Settings](#12-settings)
13. [Roles & Permissions](#13-roles--permissions)

---

## 1. Getting Started

### Logging In

1. Navigate to the application URL (default: `http://localhost:3000`)
2. Enter your email and password on the login page
3. Click **Sign In**

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Director | sarah.chen@hospital.org | password123 |
| Project Lead | james.wilson@hospital.org | password123 |
| Team Member | maria.garcia@hospital.org | password123 |
| Viewer | david.kim@hospital.org | password123 |

### Navigation

The sidebar on the left provides quick access to all major sections:
- **Dashboard** — Overview of your projects and activity
- **Projects** — All QI projects you have access to
- **Calendar** — Monthly view of task due dates
- **Activity** — Global activity feed across all projects
- **Settings** — Your profile and account settings

---

## 2. Dashboard

The dashboard is your home page after logging in. It shows:

- **Stats row** — Five cards showing key numbers:
  - Active Projects (number of projects in ACTIVE status)
  - Open Tasks (tasks assigned to you that are not DONE)
  - Due This Week (tasks due within the current week)
  - Completed This Month (tasks marked DONE this month)
  - Pending Reviews (inbox messages awaiting human review)

- **Recent Projects** — Your four most recently updated projects with progress bars showing task completion percentage

- **Recent Activity** — The 10 most recent activity entries across all your projects

---

## 3. Projects

### Viewing Projects

Navigate to **Projects** from the sidebar to see all projects you have access to. Directors can see all projects; other users see only projects they are members of.

Each project card shows:
- Project title and status badge (Planning, Active, On Hold, Completed, Cancelled)
- QI methodology badge (DMAIC, PDSA, LEAN, SIX_SIGMA, OTHER)
- Department and owner
- Task progress bar
- Member avatars

### Creating a Project

1. Click the **New Project** button (top right of the projects page)
2. Fill in the project details:
   - **Title** (required) — Name of your QI project
   - **Description** — Brief overview of the improvement initiative
   - **Methodology** — Select the QI methodology (DMAIC, PDSA, LEAN, SIX_SIGMA, or OTHER)
   - **Department** and **Unit** — Organizational context
   - **Target Metric** — What you're measuring (e.g., "CAUTI Rate per 1000 catheter days")
   - **Baseline Value** and **Goal Value** — Starting point and target
   - **Start Date** and **Target End Date** — Timeline
   - **Priority** — LOW, MEDIUM, HIGH, or URGENT
3. Click **Create Project**

The system automatically generates phases based on your selected methodology (e.g., PDSA creates Plan, Do, Study, Act phases).

### Project Detail Page

Click any project card to open the project detail page. The header shows:
- Project title, status, and methodology
- Target metric with baseline → goal values
- Task progress (completed/total)
- Team member avatars

Below the header, six tabs organize all project content:

| Tab | Description |
|-----|-------------|
| **Board** | Kanban board for task management |
| **Inbox** | AI-powered update processing |
| **Activity** | Project-specific activity log |
| **Timeline** | Gantt chart showing phases and tasks over time |
| **Metrics** | Quality metrics with run charts and SPC charts |
| **Surveys** | Create, distribute, and analyze surveys *(v0.3.0)* |
| **Meetings** | AI-powered meeting note processing *(v0.4.0)* |

---

## 4. Kanban Board

The Board tab displays your project phases as columns with tasks as cards.

### Task Cards

Each task card shows:
- Task title
- Priority indicator (color-coded: gray=LOW, blue=MEDIUM, amber=HIGH, red=URGENT)
- Assignee avatar
- Due date (if set)

### Creating a Task

1. Click the **+ Add Task** button at the bottom of any phase column
2. Enter the task title
3. Press Enter or click the checkmark to create

### Editing a Task

Click any task card to open the **Task Detail Sheet** (slide-over panel):
- **Title** — Click to edit inline
- **Description** — Rich text area for details
- **Status** — TODO, IN_PROGRESS, or DONE
- **Priority** — LOW, MEDIUM, HIGH, or URGENT
- **Assignee** — Select from project members
- **Due Date** — Date picker

Changes save automatically (debounced auto-save).

### Moving Tasks

**Drag and drop** tasks between phase columns:
- Grab a task card and drag it to another column to move it to a different phase
- Drag within the same column to reorder tasks
- Changes persist immediately

### Task Filtering *(v0.1.2)*

Use the filter bar above the board to narrow down tasks:
- **Status filter** — Show only TODO, IN_PROGRESS, or DONE tasks
- **Priority filter** — Filter by priority level
- **Assignee filter** — Show tasks assigned to a specific team member
- **Search** — Type to filter tasks by title

---

## 5. AI Inbox

The Inbox tab processes free-text updates (meeting notes, status reports, observations) into structured project actions using AI.

### Submitting an Update

1. Click **Submit Update** in the Inbox tab
2. Enter a **Subject** (brief label for the update)
3. Paste the **update text** — this can be meeting notes, a status email, verbal notes, etc.
4. Click **Submit**

The AI processes your message and extracts actionable items such as:
- **CREATE_TASK** — New tasks to add to the project
- **UPDATE_TASK** — Changes to existing tasks
- **COMPLETE_TASK** — Tasks to mark as done
- **ADD_NOTE** — Notes to log on a task
- **STATUS_UPDATE** — Phase or project status changes

### Reviewing Actions

After AI processing, each message shows extracted actions with:
- Action type icon and description
- Extracted data preview (what the AI understood)
- **Approve** / **Reject** buttons for each action

You can also:
- **Approve All** — Apply all pending actions at once
- **Reject All** — Dismiss all pending actions
- **Reprocess** — Re-run AI processing if the initial attempt failed

### Inbox Settings *(v0.1.2)*

Click the gear icon to configure:
- **Inbox Enabled** — Toggle the inbox feature on/off
- **Auto-Apply** — When enabled, AI-extracted actions are applied immediately without manual review
- **Shortcode** — Unique project identifier for future email/SMS routing

### Filter Messages

Use filter chips to view messages by status:
- **All** — All messages
- **Pending** — Awaiting review
- **Applied** — Actions approved and applied
- **Rejected** — Actions dismissed
- **Failed** — Processing errors

---

## 6. Timeline (Gantt Chart)

*Added in v0.2.0*

The Timeline tab shows a visual Gantt chart of your project's phases and tasks over time.

### What You'll See

- **Month headers** — Horizontal time scale across the top
- **Phase swimlanes** — Each phase is a row with a colored bar showing its date range
  - Gray = NOT_STARTED
  - Blue = IN_PROGRESS
  - Green = COMPLETED
- **Task bars** — Nested under their phase, showing individual task timelines
  - Slate/gray = TODO
  - Blue = IN_PROGRESS
  - Green = DONE
- **Today marker** — A red dashed vertical line showing today's date
- **Tooltips** — Hover over any task bar to see details (title, status, assignee, due date)

### Requirements

The Gantt chart uses dates from your phases and tasks:
- **Phase dates**: Set `startDate` and `targetDate` on each phase
- **Task dates**: Set `dueDate` on tasks

If no dates are set, an empty state message will appear prompting you to add dates to your phases and tasks.

### Tips

- The chart automatically calculates the time range from all available dates and adds 2 weeks of padding
- Task bars start from their phase's start date and end at the task's due date
- Completed tasks show in green regardless of their due date

---

## 7. Metrics & Charts

*Added in v0.2.0*

The Metrics tab lets you track quality improvement metrics over time using run charts and SPC (Statistical Process Control) charts.

### Viewing Metrics

When you open the Metrics tab, you'll see a grid of metric cards. Each card shows:
- **Metric name** and unit of measurement
- **Latest value** prominently displayed
- **Sparkline** — A tiny line chart showing recent trend
- **Trend indicator** — Arrow up (improving), arrow down (declining), or dash (stable)
- **Target** — The goal value (if set)

Click any metric card to open the **detail sheet**.

### Metric Detail Sheet

The detail sheet slides in from the right and shows:

1. **Chart View** — Toggle between:
   - **Run Chart** — Line chart with:
     - Green data line connecting all recorded values
     - Gray dashed **median** line
     - Amber dashed **target** line (if set)
   - **SPC Chart** — Statistical process control chart with:
     - Green data line
     - Red dashed **UCL** (Upper Control Limit) and **LCL** (Lower Control Limit)
     - Gray **center line** (mean)
     - Amber dashed **target** line (if set)
     - **Red dots** for out-of-control points (values beyond UCL/LCL)

2. **Metric Properties** (editable by LEAD/DIRECTOR):
   - Name, unit, target value
   - Upper and lower control limit bounds (for SPC charts)

3. **Data Table** — List of all recorded data points showing date, value, notes, and who recorded it

4. **Add Data Point** form (for MEMBER+ roles)

### Creating a Metric

1. Click **Add Metric** button (requires LEAD or DIRECTOR role)
2. Fill in the form:
   - **Name** (required) — e.g., "CAUTI Rate per 1000 Catheter Days"
   - **Unit** — e.g., "per 1000 days", "%", "minutes"
   - **Target** — Goal value to achieve
   - **Lower Bound** — Custom LCL for SPC chart (auto-calculated from data if not set)
   - **Upper Bound** — Custom UCL for SPC chart (auto-calculated from data if not set)
3. Click **Create**

### Adding Data Points

1. Open a metric by clicking its card
2. In the detail sheet, scroll to the **Add Data Point** section
3. Enter:
   - **Value** (required) — The measurement
   - **Date** — When the measurement was taken (defaults to now)
   - **Notes** — Optional context about this reading
4. Click **Add**

The chart and sparkline update immediately with the new data point.

### Understanding SPC Charts

SPC (Statistical Process Control) charts help determine if a process is stable:

- **Center line (CL)**: Mean of all data points
- **Upper Control Limit (UCL)**: Mean + 3 standard deviations (or your custom upper bound)
- **Lower Control Limit (LCL)**: Mean - 3 standard deviations (or your custom lower bound)
- **Out-of-control points**: Values outside UCL/LCL appear as larger red dots, indicating special cause variation

A process is considered "in control" when all points fall within the control limits with no non-random patterns.

### Deleting Metrics and Data Points

- **Delete a metric**: Open the metric detail sheet → click the delete button (LEAD/DIRECTOR only)
- **Delete a data point**: In the data table, click the trash icon next to any data point (LEAD/DIRECTOR only)

---

## 8. Surveys & Feedback

*Added in v0.3.0*

The Surveys tab lets you create surveys, distribute them via public links, collect anonymous responses, and view aggregate results.

### Creating a Survey

1. Click **New Survey** button (requires LEAD or DIRECTOR role)
2. Enter a **Title** (required) and optional **Description**
3. Add questions using the question builder:
   - Enter **question text**
   - Select **question type**:
     - **Free Text** — open-ended text response
     - **Rating (1-5)** — numeric scale from 1 to 5
     - **Multiple Choice** — select from predefined options (add 2+ options)
     - **Yes / No** — binary choice
     - **Likert Scale** — 5-point agree/disagree scale (Strongly Disagree → Strongly Agree)
   - Toggle **Required** to make the question mandatory
4. Click **Create Survey** — the survey is saved as a **Draft**

### Editing a Draft Survey

While in Draft status, you can:
- Edit the survey title and description
- Add, edit, or remove questions
- Reorder questions

Once published, questions and title can no longer be changed.

### Publishing a Survey

1. Open the survey by clicking its card
2. Click **Publish** (requires at least 1 question)
3. The survey becomes live and a **public link** is generated
4. Copy the link or open it in a new tab to share with respondents

The public link takes respondents to a clean, no-login-required page where they can fill in the survey.

### Viewing Results

1. Open a survey and click the **Results** tab
2. Each question shows aggregate data:
   - **Rating** questions: average score + bar chart distribution
   - **Yes/No**, **Multiple Choice**, **Likert Scale**: horizontal bar charts showing response counts
   - **Free Text**: scrollable list of all text responses
3. The response count is shown on the survey card and in the detail sheet

### Closing a Survey

1. Open a published survey
2. Click **Close Survey**
3. The survey stops accepting responses and becomes read-only
4. Existing results remain viewable

### Deleting a Survey

Click **Delete** on any survey (requires LEAD or DIRECTOR role). This permanently removes the survey, all questions, and all responses.

---

## 9. AI Meeting Notes

*Added in v0.4.0*

The Meetings tab lets you paste meeting notes or transcripts, have AI extract a summary, key decisions, and action items, then review and apply those actions to your project.

### Submitting Meeting Notes

1. Click **Submit Meeting Notes** in the Meetings tab
2. Fill in the form:
   - **Title** (required) — Name of the meeting (e.g., "Weekly CAUTI Huddle")
   - **Meeting Date** (required) — When the meeting took place (defaults to today)
   - **Attendees** — Comma-separated names (optional)
   - **Duration** — Length in minutes (optional)
   - **Transcript** (required) — Paste the full meeting notes or transcript
3. Click **Submit**

The AI processes the transcript and extracts:
- **Meeting Summary** — A 3-5 sentence overview
- **Key Decisions** — Important decisions made during the meeting (displayed as a bulleted list)
- **Action Items** — Structured actions such as:
  - **CREATE_TASK** — New tasks to add to the project
  - **UPDATE_TASK** — Changes to existing tasks
  - **COMPLETE_TASK** — Tasks to mark as done
  - **ADD_NOTE** — Notes to log on a task
  - **STATUS_UPDATE** — Phase or project status changes

### Reviewing Actions

After AI processing, each meeting note card shows:
- Submitter name and avatar
- Meeting date, duration, and attendee badges
- Status badge (Received, Processing, Reviewed, Applied, Rejected, Failed)
- AI-generated summary and key decisions
- List of extracted actions with approve/reject buttons

You can:
- **Approve** / **Reject** individual actions
- **Approve All** — Apply all pending actions at once
- **Reject All** — Dismiss all pending actions
- **Retry** — Re-run AI processing if the initial attempt failed

### Expanding the Transcript

Click the **transcript toggle** on any meeting note card to expand and view the full raw transcript.

### Filtering Meeting Notes

Use the filter chips at the top of the Meetings tab:
- **All** — All meeting notes
- **Pending** — Notes with actions awaiting review
- **Applied** — All actions approved and applied
- **Rejected** — All actions dismissed
- **Failed** — Processing errors

### Deleting Meeting Notes

Click the trash icon on a meeting note to delete it (requires LEAD or DIRECTOR role). This permanently removes the meeting note and all its associated actions.

---

## 10. Activity Feed

Every action in the system is logged with a timestamp and the user who performed it.

### Project Activity

The **Activity** tab on each project detail page shows that project's activity, including:
- Task creation, updates, and completion
- Phase status changes
- Inbox message processing and action application
- Metric creation and data point additions *(v0.2.0)*
- Survey creation, publishing, closing, and response tracking *(v0.3.0)*
- Meeting note processing and action application *(v0.4.0)*
- Member additions

### Global Activity

Navigate to **Activity** from the sidebar to see activity across all projects you have access to. This view supports pagination to browse through historical entries.

### Activity Entry Details

Each activity entry shows:
- **Icon** — Color-coded by action type (green for creates, blue for updates, red for deletes)
- **Description** — Human-readable summary of what happened
- **User** — Who performed the action (with avatar)
- **Timestamp** — When it happened
- **Source badge** — Whether it was a manual action, AI inbox, or system event

---

## 11. Calendar

The **Calendar** page shows a monthly grid with task due dates marked as dots.

### Navigation
- Use the **left/right arrows** to move between months
- Click **Today** to jump back to the current month

### Viewing Tasks
- Days with due tasks show colored dots
- Click any day to see the detail panel on the right, listing all tasks due that day
- Each task shows its title, project, assignee, and status

---

## 12. Settings

Navigate to **Settings** from the sidebar to view and manage your profile:

- **Name** and **Email** — Your account details
- **Department** — Your organizational department
- **Role** — Your system-level role (view only — changed by Directors)

---

## 13. Roles & Permissions

QIapp uses a two-tier permission model.

### System Roles

Your system role determines what you can do across the entire application:

| Role | What You Can Do |
|------|----------------|
| **Director** | See all projects, full CRUD everywhere, manage users |
| **Project Lead** | Create projects, manage your own projects |
| **Team Member** | Work on projects you're assigned to |
| **Viewer** | Read-only access to assigned projects |

### Project Roles

Within each project, your project role determines fine-grained permissions:

| Role | Board | Inbox | Metrics | Surveys | Timeline |
|------|-------|-------|---------|---------|----------|
| **Lead** | Full edit (all tasks, members, phases) | Approve/reject actions | Create/edit/delete metrics, add data | Create/publish/close/delete surveys | View |
| **Member** | Edit all task fields | View only | Add data points only | View only | View |
| **Stakeholder** | Update status on own tasks only | View only | View only | View only | View |

### Permission Summary for Metrics *(v0.2.0)*

| Action | Director | Lead | Member | Stakeholder |
|--------|----------|------|--------|-------------|
| View metrics & charts | Yes | Yes | Yes | Yes |
| Create new metric | Yes | Yes | No | No |
| Edit metric properties | Yes | Yes | No | No |
| Delete metric | Yes | Yes | No | No |
| Add data point | Yes | Yes | Yes | No |
| Delete data point | Yes | Yes | No | No |

### Permission Summary for Surveys *(v0.3.0)*

| Action | Director | Lead | Member | Stakeholder |
|--------|----------|------|--------|-------------|
| View surveys & results | Yes | Yes | Yes | Yes |
| Create new survey | Yes | Yes | No | No |
| Edit draft survey | Yes | Yes | No | No |
| Publish survey | Yes | Yes | No | No |
| Close survey | Yes | Yes | No | No |
| Delete survey | Yes | Yes | No | No |
| Submit response (public) | No auth required | No auth required | No auth required | No auth required |

### Permission Summary for Meeting Notes *(v0.4.0)*

| Action | Director | Lead | Member | Stakeholder |
|--------|----------|------|--------|-------------|
| View meeting notes | Yes | Yes | Yes | Yes |
| Submit meeting notes | Yes | Yes | Yes | Yes |
| Approve/reject actions | Yes | Yes | No | No |
| Approve all / Reject all | Yes | Yes | No | No |
| Reprocess (retry AI) | Yes | Yes | No | No |
| Delete meeting note | Yes | Yes | No | No |

---

## Appendix: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Click + Drag | Move tasks between phases on the Kanban board |
| Enter | Submit task title when creating a new task |
| Escape | Close dialog or sheet |

---

*This guide is updated as new features are built. Last updated: v0.4.0 (2026-03-02)*
