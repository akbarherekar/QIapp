import {
  LayoutDashboard,
  FolderKanban,
  KanbanSquare,
  Inbox,
  NotebookText,
  BarChart3,
  ClipboardList,
  CalendarDays,
  Users,
  Shield,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const sections = [
  {
    id: "dashboard",
    number: 1,
    icon: LayoutDashboard,
    title: "Welcome & Dashboard",
    description:
      "Your dashboard is the home base. It shows at-a-glance stats for active projects, open tasks, items due this week, and completions this month. Below the stats you'll find your most recent projects with progress bars and a live activity feed showing what your team has been doing.",
    tips: [
      "The dashboard updates automatically — check it each morning for a quick status overview",
      "Click any project card to jump straight into it",
      "The activity feed shows actions from all projects you have access to",
    ],
  },
  {
    id: "creating-project",
    number: 2,
    icon: FolderKanban,
    title: "Creating a Project",
    description:
      'Click the "+ New Project" button on the Projects page to start. Choose a title, select your QI methodology (PDSA, DMAIC, Lean, Six Sigma, or Other), set priority, and optionally fill in department, target metric, baseline value, and goal. When you save, the system automatically generates the phases for your chosen methodology.',
    tips: [
      "PDSA creates: Plan, Do, Study, Act phases",
      "DMAIC creates: Define, Measure, Analyze, Improve, Control phases",
      "Lean creates: Identify Value, Map Value Stream, Create Flow, Establish Pull, Seek Perfection",
      "You can switch methodology later from the project header — tasks are preserved",
    ],
  },
  {
    id: "kanban-board",
    number: 3,
    icon: KanbanSquare,
    title: "The Kanban Board",
    description:
      'Each project has a Board tab showing phases as columns. Click "+ Add task" at the bottom of any phase column to create a task. Each task can have a title, description, assignee, due date, and priority. Drag and drop tasks between phases to track progress — for example, moving a task from "Plan" to "Do" in a PDSA project.',
    tips: [
      "Drag tasks between columns to move them through phases",
      "Click a task card to open the detail sheet for editing",
      "Use the search bar and filters (priority, assignee) to find specific tasks",
      "Tasks track status (To Do, In Progress, Done) independently of which phase they're in",
    ],
  },
  {
    id: "ai-inbox",
    number: 4,
    icon: Inbox,
    title: "AI-Powered Inbox",
    description:
      'The Inbox tab is one of the most powerful features. Click "Submit Update" and paste any free-text content — meeting notes, email updates, verbal reports. The AI reads your text and automatically extracts actionable items: creating tasks, updating statuses, logging notes, or moving phases. Each suggested action appears for your review.',
    tips: [
      "Paste raw meeting minutes — the AI will figure out what actions to take",
      'Review each extracted action and click "Approve" or "Reject"',
      '"Apply All" approves every pending action at once for speed',
      'Enable "Auto-Apply" in Inbox Settings if you trust the AI to apply actions without review',
      "You can reprocess a message if the AI missed something",
    ],
  },
  {
    id: "meeting-notes",
    number: 5,
    icon: NotebookText,
    title: "AI Meeting Notes",
    description:
      "The Meetings tab works similarly to the Inbox but is structured for meeting minutes. Submit a meeting title, date, attendees, duration, and the full transcript or notes. The AI processes the transcript and extracts a summary, key decisions, and specific action items. You review and approve each action just like the Inbox.",
    tips: [
      "Include attendee names — the AI will try to match them as task assignees",
      "The more detail in your notes, the better the AI extraction",
      "Key decisions are highlighted separately from action items",
      "Committee-level meetings can route actions across multiple projects",
    ],
  },
  {
    id: "metrics",
    number: 6,
    icon: BarChart3,
    title: "Metrics & Charts",
    description:
      'The Metrics tab lets you track QI data over time. Click "Create Metric" to define what you\'re measuring (e.g., "CAUTI rate per 1,000 catheter days"), set a target value and optional control limits (upper/lower bounds). Then regularly add data points with values and notes. The system generates two types of charts automatically.',
    tips: [
      "Run Charts show your data trend over time with the median line",
      "SPC Charts (Statistical Process Control) add upper and lower control limits to detect special-cause variation",
      "Add data points consistently (e.g., weekly) for meaningful trends",
      "Each data point records who entered it and when",
    ],
  },
  {
    id: "surveys",
    number: 7,
    icon: ClipboardList,
    title: "Surveys & Feedback",
    description:
      'The Surveys tab lets you create questionnaires to collect structured feedback. Build a survey with a title and questions (multiple choice, text, rating scales, etc.). Click "Publish" to generate a public link that anyone can access without logging in — perfect for patient or staff surveys. Close the survey when you have enough responses and review the results.',
    tips: [
      "Published surveys get a shareable public URL — no login required for respondents",
      "You can add, edit, and reorder questions before publishing",
      "View response counts and aggregated results in the results view",
      "Close the survey to stop accepting new responses",
    ],
  },
  {
    id: "timeline",
    number: 8,
    icon: CalendarDays,
    title: "Gantt Timeline",
    description:
      "The Timeline tab shows a visual Gantt-style chart of your project phases and tasks over time. Each phase is a horizontal bar spanning its start and target dates, with individual tasks shown within. This helps you see the overall project schedule, identify overlaps, and spot tasks that may be falling behind.",
    tips: [
      "Set start and target dates on phases for the most useful timeline view",
      "Tasks with due dates appear as markers within their phase bar",
      "Use this view for stakeholder presentations and progress reports",
    ],
  },
  {
    id: "committees",
    number: 9,
    icon: Users,
    title: "Committees",
    description:
      'Committees (also called Project Groups) let you organize related projects under a shared team. Create a committee from the Committees page, add members with roles (Chair, Secretary, Member), and link existing projects to it. The key feature: group-level meetings — submit meeting notes that span multiple projects, and the AI will route extracted actions to the correct project automatically.',
    tips: [
      "Chairs can manage all aspects of the committee including removing projects",
      "Secretaries can add members, link projects, and manage meetings",
      "Group-level meeting notes can create tasks across different linked projects",
      "Your committees appear in the sidebar for quick access",
    ],
  },
  {
    id: "roles",
    number: 10,
    icon: Shield,
    title: "Roles & Permissions",
    description:
      "The platform uses three layers of roles. System roles control what you can do globally: Directors see everything, Project Leads can create projects, Team Members access assigned projects, and Viewers are read-only. Within each project, members have a project role: Lead (full control), Member (edit tasks), or Stakeholder (update own tasks only). Committees have their own roles too: Chair, Secretary, and Member.",
    tips: [
      "Directors have full access to all projects and can manage users",
      "Project Leads can create new projects and manage their own",
      "Only project Leads can edit project settings and manage members",
      "Committee Chairs can remove projects and manage all members",
    ],
  },
]

export default function TutorialPage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Getting Started
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          A step-by-step guide to using QI Tracker for your quality improvement
          projects.
        </p>
      </div>

      {/* Quick nav */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Jump to a section
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <s.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{s.title}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quick start summary */}
      <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h2 className="text-sm font-semibold text-emerald-900">
              Quick Start (5 minutes)
            </h2>
            <ol className="mt-2 space-y-1.5 text-sm text-emerald-800">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
                  1
                </span>
                Go to <strong>Projects</strong> and click{" "}
                <strong>+ New Project</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
                  2
                </span>
                Choose a methodology (PDSA is a great default) and set your
                target metric
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
                  3
                </span>
                Add tasks to your phases on the <strong>Board</strong> tab
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
                  4
                </span>
                Paste meeting notes into the <strong>Inbox</strong> and let AI
                extract action items
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
                  5
                </span>
                Track your progress with <strong>Metrics</strong> and{" "}
                <strong>Charts</strong>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            className="scroll-mt-20 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {section.number}
                  </span>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {section.title}
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {section.description}
                </p>

                {section.tips.length > 0 && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <ArrowRight className="h-3 w-3" />
                      Key Tips
                    </h3>
                    <ul className="space-y-1.5">
                      {section.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Need more help?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Contact your QI department administrator or reach out to
          SurgeryReady LLC for support.
        </p>
      </div>
    </div>
  )
}
