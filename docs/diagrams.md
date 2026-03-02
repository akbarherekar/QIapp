# Diagrams & Visualizations

> **Version History**
> - **v0.1.0** (2026-02-28) — Diagrams 1–10 (Core ERD, Auth, Project, Kanban, Pages, Components, Auth Tree, Dashboard, Enums, Module Map)
> - **v0.1.1** (2026-03-01) — ERD updated with InboxMessage + InboxAction entities
> - **v0.2.0** (2026-03-01) — Diagrams 11–13 (Metrics ERD, Metrics Data Flow, Gantt Timeline Structure)
> - **v0.3.0** (2026-03-02) — ERD updated with Survey models, Diagrams 14–15 (Survey Data Flow, Survey Lifecycle), updated Tab Structure and Module Integration

All diagrams use [Mermaid.js](https://mermaid.js.org/) syntax and render natively in GitHub, VS Code, and most Markdown viewers.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Project : "owns"
    User ||--o{ ProjectMember : "has memberships"
    User ||--o{ Task : "assigned to"
    User ||--o{ ActivityLog : "performs"

    Project ||--o{ ProjectMember : "has members"
    Project ||--o{ ProjectPhase : "has phases"
    Project ||--o{ ActivityLog : "has activity"

    ProjectMember }o--|| User : "references"
    ProjectMember }o--|| Project : "references"

    ProjectPhase ||--o{ Task : "contains"

    Task }o--o| User : "assigned to"

    User {
        string id PK
        string email UK
        string name
        string hashedPassword
        SystemRole role
        string department
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id PK
        string title
        string description
        ProjectStatus status
        Priority priority
        Methodology methodology
        string department
        string unit
        string targetMetric
        string baselineValue
        string goalValue
        datetime startDate
        datetime targetEndDate
        datetime actualEndDate
        string ownerId FK
    }

    ProjectMember {
        string id PK
        string projectId FK
        string userId FK
        ProjectMemberRole role
        datetime joinedAt
    }

    ProjectPhase {
        string id PK
        string projectId FK
        string name
        PhaseStatus status
        int orderIndex
        datetime startDate
        datetime targetDate
    }

    Task {
        string id PK
        string projectPhaseId FK
        string title
        string description
        TaskStatus status
        Priority priority
        string assigneeId FK
        datetime dueDate
        datetime completedAt
        int orderIndex
    }

    ActivityLog {
        string id PK
        string projectId FK
        string userId FK
        string action
        string details
        ActivitySource source
        json metadata
        datetime createdAt
    }

    Project ||--o{ InboxMessage : "has inbox messages"
    User ||--o{ InboxMessage : "sends"
    InboxMessage ||--o{ InboxAction : "has actions"

    InboxMessage {
        string id PK
        string projectId FK
        string senderId FK
        InboxMessageChannel channel
        InboxMessageStatus status
        string senderIdentifier
        string rawBody
        string processedSummary
        string classification
        json llmResponse
        datetime createdAt
        datetime processedAt
    }

    InboxAction {
        string id PK
        string inboxMessageId FK
        InboxActionType actionType
        InboxActionStatus status
        string description
        json extractedData
        json appliedData
        datetime appliedAt
    }

    Project ||--o{ MetricDefinition : "has metrics"
    MetricDefinition ||--o{ MetricDataPoint : "has data points"
    User ||--o{ MetricDataPoint : "records"

    MetricDefinition {
        string id PK
        string projectId FK
        string name
        string unit
        float lowerBound
        float upperBound
        float target
        datetime createdAt
        datetime updatedAt
    }

    MetricDataPoint {
        string id PK
        string metricId FK
        float value
        datetime recordedAt
        string notes
        string recordedById FK
        datetime createdAt
    }

    Project ||--o{ Survey : "has surveys"
    User ||--o{ Survey : "creates"
    Survey ||--o{ SurveyQuestion : "has questions"
    Survey ||--o{ SurveyResponse : "has responses"
    SurveyResponse ||--o{ SurveyAnswer : "has answers"
    SurveyAnswer }o--|| SurveyQuestion : "answers"

    Survey {
        string id PK
        string projectId FK
        string createdById FK
        string title
        string description
        SurveyStatus status
        datetime publishedAt
        datetime closedAt
        datetime createdAt
        datetime updatedAt
    }

    SurveyQuestion {
        string id PK
        string surveyId FK
        string text
        QuestionType type
        boolean required
        json options
        int orderIndex
    }

    SurveyResponse {
        string id PK
        string surveyId FK
        string respondentName
        datetime submittedAt
    }

    SurveyAnswer {
        string id PK
        string responseId FK
        string questionId FK
        string value
    }
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Next.js Server
    participant A as NextAuth
    participant DB as PostgreSQL

    Note over B,DB: Login Flow
    B->>N: POST /api/auth/callback/credentials
    N->>A: authorize(email, password)
    A->>DB: findUnique({ email })
    DB-->>A: User record
    A->>A: bcrypt.compare(password, hashedPassword)
    alt Valid credentials
        A->>A: Generate JWT (id, role, department)
        A-->>N: Set httpOnly cookie
        N-->>B: 200 + redirect to /
    else Invalid credentials
        A-->>N: null
        N-->>B: 401 + error message
    end

    Note over B,DB: Authenticated Request
    B->>N: GET /projects (with JWT cookie)
    N->>A: auth() — decode JWT
    A-->>N: session.user { id, role, department }
    N->>DB: Prisma query (filtered by role)
    DB-->>N: Project data
    N-->>B: Rendered HTML (Server Component)
```

---

## 3. Project Creation Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant API as POST /api/projects
    participant DB as PostgreSQL
    participant AL as ActivityLogger

    U->>API: { title, methodology, department, ... }
    API->>API: Zod validation
    API->>API: requireAuth() — check JWT

    API->>DB: project.create({ ...data, ownerId })
    DB-->>API: Project record

    API->>DB: projectPhase.createMany(METHODOLOGY_PHASES[methodology])
    Note right of DB: e.g., PDSA → Plan, Do, Study, Act

    API->>DB: projectMember.create({ userId, role: LEAD })
    Note right of DB: Creator auto-added as LEAD

    API->>AL: logActivity("PROJECT_CREATED", ...)
    AL->>DB: activityLog.create(...)

    API-->>U: 201 { project }
    U->>U: router.refresh() + close dialog
```

---

## 4. Kanban Drag-and-Drop Flow

```mermaid
sequenceDiagram
    participant U as User
    participant KB as KanbanBoard (Client)
    participant API as API Routes
    participant DB as PostgreSQL

    U->>KB: Drag task from Phase A to Phase B
    KB->>KB: DndContext onDragEnd fires
    KB->>KB: Optimistic state update (move task locally)

    alt Same phase (reorder only)
        KB->>API: PUT /api/tasks/reorder
        Note right of API: { tasks: [{ id, orderIndex }] }
        API->>DB: Batch update orderIndex
    else Different phase (move + reorder)
        KB->>API: PATCH /api/tasks/[id]
        Note right of API: { projectPhaseId: newPhaseId }
        API->>DB: Update task.projectPhaseId
        API->>DB: Log activity "TASK_MOVED"
        KB->>API: PUT /api/tasks/reorder
        API->>DB: Batch update orderIndex in both phases
    end

    DB-->>API: Success
    API-->>KB: 200
```

---

## 5. Application Page Structure

```mermaid
graph TD
    Root["RootLayout<br/>(Inter font, Toaster)"]

    Root --> AuthGroup["(auth) Layout<br/>Centered, no sidebar"]
    Root --> DashGroup["(dashboard) Layout<br/>Sidebar + Header"]

    AuthGroup --> Login["/login"]
    AuthGroup --> Register["/register"]

    DashGroup --> Dashboard["/ Dashboard<br/>Stats, Recent Projects, Activity"]
    DashGroup --> ProjectList["/projects<br/>Card Grid + Create Dialog"]
    DashGroup --> ProjectDetail["/projects/[id]<br/>Header + Kanban + Activity Tabs"]
    DashGroup --> Calendar["/calendar<br/>Monthly Grid + Task Dots"]
    DashGroup --> Activity["/activity<br/>Global Activity Feed"]
    DashGroup --> Settings["/settings<br/>Profile & Permissions"]

    style Root fill:#f8fafc,stroke:#e2e8f0
    style AuthGroup fill:#fef3c7,stroke:#f59e0b
    style DashGroup fill:#ecfdf5,stroke:#10b981
    style Dashboard fill:#fff,stroke:#e2e8f0
    style ProjectList fill:#fff,stroke:#e2e8f0
    style ProjectDetail fill:#fff,stroke:#e2e8f0
    style Calendar fill:#fff,stroke:#e2e8f0
    style Activity fill:#fff,stroke:#e2e8f0
    style Login fill:#fff,stroke:#e2e8f0
    style Register fill:#fff,stroke:#e2e8f0
```

---

## 6. Component Hierarchy

```mermaid
graph TD
    subgraph "Dashboard Layout"
        DL["DashboardLayout (Server)"]
        SB["Sidebar (Client)"]
        HD["Header (Server)"]
        UN["UserNav (Client)"]
    end

    subgraph "Project Detail Page"
        PD["ProjectDetailPage (Server)"]
        PSB["ProjectStatusBadge"]
        MB["MethodologyBadge"]
        KB["KanbanBoard (Client)"]
        AF["ActivityFeed"]
    end

    subgraph "Kanban Board"
        KB --> PC["PhaseColumn (Client)"]
        PC --> TC["TaskCard (Client)"]
        TC --> TDS["TaskDetailSheet (Client)"]
    end

    subgraph "Projects Page"
        PP["ProjectsPage (Server)"]
        PCa["ProjectCard"]
        CPD["CreateProjectDialog (Client)"]
    end

    DL --> SB
    DL --> HD
    HD --> UN
    DL --> PD
    DL --> PP
    PD --> PSB
    PD --> MB
    PD --> KB
    PD --> AF
    PP --> PCa
    PP --> CPD

    style DL fill:#ecfdf5,stroke:#10b981
    style PD fill:#ecfdf5,stroke:#10b981
    style PP fill:#ecfdf5,stroke:#10b981
    style KB fill:#fef3c7,stroke:#f59e0b
    style PC fill:#fef3c7,stroke:#f59e0b
    style TC fill:#fef3c7,stroke:#f59e0b
    style TDS fill:#fef3c7,stroke:#f59e0b
    style SB fill:#fef3c7,stroke:#f59e0b
    style UN fill:#fef3c7,stroke:#f59e0b
    style CPD fill:#fef3c7,stroke:#f59e0b
```

*Legend: Green = Server Component, Yellow = Client Component (`'use client'`)*

---

## 7. Authorization Decision Tree

```mermaid
flowchart TD
    A[Incoming Request] --> B{Authenticated?}
    B -->|No| C[Redirect to /login]
    B -->|Yes| D{Route type?}

    D -->|Page read| E{Is DIRECTOR?}
    E -->|Yes| F[Show all data]
    E -->|No| G{Is project member?}
    G -->|Yes| H[Show project data]
    G -->|No| I[404 Not Found]

    D -->|API mutation| J{Is DIRECTOR?}
    J -->|Yes| K[Allow all mutations]
    J -->|No| L{Check project role}
    L --> M{Has min required role?}
    M -->|Yes| N[Allow mutation + log activity]
    M -->|No| O[403 Forbidden]

    style C fill:#fee2e2,stroke:#ef4444
    style I fill:#fee2e2,stroke:#ef4444
    style O fill:#fee2e2,stroke:#ef4444
    style F fill:#ecfdf5,stroke:#10b981
    style H fill:#ecfdf5,stroke:#10b981
    style K fill:#ecfdf5,stroke:#10b981
    style N fill:#ecfdf5,stroke:#10b981
```

---

## 8. Data Flow: Dashboard Page

```mermaid
flowchart LR
    subgraph "Server Component"
        A["requireAuth()"] --> B["Promise.all()"]
        B --> C1["db.project.count<br/>(active)"]
        B --> C2["db.task.count<br/>(open, assigned)"]
        B --> C3["db.task.count<br/>(due this week)"]
        B --> C4["db.task.count<br/>(completed this month)"]
        B --> C5["db.inboxMessage.count<br/>(pending reviews)"]
        B --> C6["db.project.findMany<br/>(recent 4)"]
        B --> C7["db.activityLog.findMany<br/>(recent 10)"]
    end

    C1 --> R["Render HTML"]
    C2 --> R
    C3 --> R
    C4 --> R
    C5 --> R
    C6 --> R
    C7 --> R

    R --> Client["Browser"]

    style A fill:#dbeafe,stroke:#3b82f6
    style B fill:#dbeafe,stroke:#3b82f6
    style R fill:#ecfdf5,stroke:#10b981
```

---

## 9. Enum Reference

```mermaid
graph LR
    subgraph "SystemRole"
        SR1["DIRECTOR (4)"]
        SR2["PROJECT_LEAD (3)"]
        SR3["TEAM_MEMBER (2)"]
        SR4["VIEWER (1)"]
    end

    subgraph "ProjectMemberRole"
        PR1["LEAD (3)"]
        PR2["MEMBER (2)"]
        PR3["STAKEHOLDER (1)"]
    end

    subgraph "ProjectStatus"
        PS1["PLANNING"]
        PS2["ACTIVE"]
        PS3["ON_HOLD"]
        PS4["COMPLETED"]
        PS5["CANCELLED"]
    end

    subgraph "TaskStatus"
        TS1["TODO"]
        TS2["IN_PROGRESS"]
        TS3["DONE"]
    end

    subgraph "PhaseStatus"
        PH1["NOT_STARTED"]
        PH2["IN_PROGRESS"]
        PH3["COMPLETED"]
    end

    subgraph "Methodology"
        M1["DMAIC"]
        M2["PDSA"]
        M3["LEAN"]
        M4["SIX_SIGMA"]
        M5["OTHER"]
    end

    subgraph "ActivitySource"
        AS1["MANUAL"]
        AS2["AI_MEETING"]
        AS3["AI_FEEDBACK"]
        AS4["AI_INBOX"]
        AS5["SYSTEM"]
    end

    subgraph "InboxMessageStatus"
        IMS1["RECEIVED"]
        IMS2["PROCESSING"]
        IMS3["REVIEWED"]
        IMS4["APPLIED"]
        IMS5["REJECTED"]
        IMS6["FAILED"]
    end

    subgraph "InboxActionType"
        IAT1["CREATE_TASK"]
        IAT2["UPDATE_TASK"]
        IAT3["COMPLETE_TASK"]
        IAT4["ADD_NOTE"]
        IAT5["STATUS_UPDATE"]
    end

    subgraph "SurveyStatus"
        SS1["DRAFT"]
        SS2["PUBLISHED"]
        SS3["CLOSED"]
    end

    subgraph "QuestionType"
        QT1["TEXT"]
        QT2["RATING"]
        QT3["MULTIPLE_CHOICE"]
        QT4["YES_NO"]
        QT5["LIKERT_SCALE"]
    end

    style SR1 fill:#ecfdf5,stroke:#10b981
    style SR2 fill:#dbeafe,stroke:#3b82f6
    style SR3 fill:#fef3c7,stroke:#f59e0b
    style SR4 fill:#f3f4f6,stroke:#9ca3af
```

---

## 10. Module Integration Points

```mermaid
graph TD
    subgraph "Module 1 — Project Management (v0.1.0)"
        PM[Projects / Tasks / Phases]
        AL[ActivityLog]
        PM --> AL
    end

    subgraph "Module 1b — AI Inbox (v0.1.1)"
        IM[InboxMessage]
        IA[InboxAction]
        AI0["Claude API"]
        IM --> AI0
        AI0 --> IA
    end

    subgraph "Module 2 — Metrics (v0.2.0)"
        MD[MetricDefinition]
        DP[MetricDataPoint]
        RC[Run Chart]
        SC[SPC Chart]
        MD --> DP
        DP --> RC
        DP --> SC
    end

    subgraph "Module 3 — Surveys (v0.3.0)"
        SV[Survey]
        SQ[SurveyQuestion]
        SR[SurveyResponse]
        SA[SurveyAnswer]
        SV --> SQ
        SV --> SR
        SR --> SA
    end

    subgraph "Module 4 — Reports (Planned)"
        RP[ReportTemplate]
    end

    subgraph "Module 5 — AI Meetings (Planned)"
        MT[Meeting]
        AI1["Claude API"]
    end

    subgraph "Module 6 — AI Feedback (Planned)"
        AI2["Claude API"]
    end

    PM -->|targetMetric, baselineValue| MD
    PM -->|projectId| SV
    PM -->|all data| RP
    IA -->|creates/updates tasks| PM
    IA -->|source: AI_INBOX| AL
    MD -->|METRIC_CREATED, DATA_POINT_ADDED| AL
    SV -->|SURVEY_CREATED, SURVEY_PUBLISHED| AL
    SR -->|SURVEY_RESPONSE_RECEIVED| AL
    MT -->|creates tasks| PM
    MT -->|source: AI_MEETING| AL
    SR -->|categorized by| AI2
    AI2 -->|source: AI_FEEDBACK| AL

    style PM fill:#ecfdf5,stroke:#10b981
    style AL fill:#ecfdf5,stroke:#10b981
    style IM fill:#fce7f3,stroke:#ec4899
    style IA fill:#fce7f3,stroke:#ec4899
    style AI0 fill:#fce7f3,stroke:#ec4899
    style MD fill:#dbeafe,stroke:#3b82f6
    style DP fill:#dbeafe,stroke:#3b82f6
    style RC fill:#dbeafe,stroke:#3b82f6
    style SC fill:#dbeafe,stroke:#3b82f6
    style SV fill:#fef3c7,stroke:#f59e0b
    style SQ fill:#fef3c7,stroke:#f59e0b
    style SR fill:#fef3c7,stroke:#f59e0b
    style SA fill:#fef3c7,stroke:#f59e0b
    style RP fill:#e0e7ff,stroke:#6366f1
    style MT fill:#fce7f3,stroke:#ec4899
    style AI1 fill:#fce7f3,stroke:#ec4899
    style AI2 fill:#fae8ff,stroke:#c026d3
```

---

## 11. Metrics Data Flow *(v0.2.0)*

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant MT as MetricsTab (Client)
    participant API as API Routes
    participant DB as PostgreSQL
    participant AL as ActivityLogger

    Note over U,AL: Viewing Metrics (Server Component)
    U->>MT: Page load → Server fetches metrics via Prisma
    MT->>MT: Render metric cards with sparklines

    Note over U,AL: Adding a Data Point
    U->>MT: Click metric card → Sheet opens
    U->>MT: Fill value + date in AddDataPointForm
    MT->>API: POST /api/projects/[id]/metrics/[mId]/data-points
    API->>API: Zod validation + auth check
    API->>DB: metricDataPoint.create({ value, recordedAt, notes })
    DB-->>API: DataPoint record
    API->>AL: logActivity("DATA_POINT_ADDED", ...)
    AL->>DB: activityLog.create(...)
    API-->>MT: 201 { dataPoint }
    MT->>MT: Update local state → chart re-renders

    Note over U,AL: Creating a New Metric
    U->>MT: Click "Add Metric" → Dialog opens
    MT->>API: POST /api/projects/[id]/metrics
    API->>DB: metricDefinition.create({ name, unit, target, ... })
    API->>AL: logActivity("METRIC_CREATED", ...)
    API-->>MT: 201 { metric }
    MT->>MT: Add metric card to grid
```

---

## 12. Project Detail Tab Structure *(v0.3.0)*

```mermaid
graph TD
    PD["ProjectDetailPage (Server Component)"]

    PD --> T1["Board Tab"]
    PD --> T2["Inbox Tab"]
    PD --> T3["Activity Tab"]
    PD --> T4["Timeline Tab (v0.2.0)"]
    PD --> T5["Metrics Tab (v0.2.0)"]
    PD --> T6["Surveys Tab (v0.3.0)"]

    T1 --> KB["KanbanBoard (Client)"]
    KB --> PC["PhaseColumn"]
    PC --> TC["TaskCard"]

    T2 --> IT["InboxTab (Client)"]
    IT --> MC["InboxMessageCard"]
    MC --> AI["InboxActionItem"]

    T3 --> AF["ActivityFeed"]

    T4 --> GC["GanttChart (Client)"]
    GC --> PS["Phase Swimlanes"]
    GC --> TB["Task Bars"]
    GC --> TM["Today Marker"]

    T5 --> MTab["MetricsTab (Client)"]
    MTab --> MCa["MetricCard (sparkline)"]
    MTab --> MDS["MetricDetailSheet"]
    MDS --> RCh["RunChart (Recharts)"]
    MDS --> SPCh["SPCChart (Recharts)"]
    MDS --> ADP["AddDataPointForm"]

    T6 --> STab["SurveysTab (Client)"]
    STab --> SCa["SurveyCard"]
    STab --> SDS["SurveyDetailSheet"]
    SDS --> SRV["SurveyResultsView (Recharts)"]

    style PD fill:#ecfdf5,stroke:#10b981
    style T1 fill:#fff,stroke:#e2e8f0
    style T2 fill:#fff,stroke:#e2e8f0
    style T3 fill:#fff,stroke:#e2e8f0
    style T4 fill:#dbeafe,stroke:#3b82f6
    style T5 fill:#dbeafe,stroke:#3b82f6
    style T6 fill:#fef3c7,stroke:#f59e0b
    style KB fill:#fef3c7,stroke:#f59e0b
    style IT fill:#fef3c7,stroke:#f59e0b
    style GC fill:#fef3c7,stroke:#f59e0b
    style MTab fill:#fef3c7,stroke:#f59e0b
    style STab fill:#fef3c7,stroke:#f59e0b
    style RCh fill:#fce7f3,stroke:#ec4899
    style SPCh fill:#fce7f3,stroke:#ec4899
    style SRV fill:#fce7f3,stroke:#ec4899
```

*Legend: Green = Server Component, Yellow = Client Component, Blue = v0.2.0, Orange = v0.3.0, Pink = Recharts (dynamic import)*

---

## 13. Gantt Chart Date Calculation *(v0.2.0)*

```mermaid
flowchart LR
    subgraph "Input Dates"
        PSD["project.startDate"]
        PED["project.targetEndDate"]
        PhSD["phase.startDate"]
        PhTD["phase.targetDate"]
        TD["task.dueDate"]
    end

    subgraph "Range Calculation"
        MIN["min(all dates) - 14 days"]
        MAX["max(all dates) + 14 days"]
        RANGE["totalDays = MAX - MIN"]
    end

    subgraph "Bar Positioning"
        LEFT["left% = daysFromStart / totalDays * 100"]
        WIDTH["width% = duration / totalDays * 100"]
    end

    subgraph "Rendering"
        MH["Month Headers (auto-generated)"]
        PB["Phase Bars (full-width swim lanes)"]
        TKB["Task Bars (positioned within phase)"]
        TODAY["Today Marker (red dashed line)"]
    end

    PSD --> MIN
    PED --> MAX
    PhSD --> MIN
    PhTD --> MAX
    TD --> MAX

    MIN --> RANGE
    MAX --> RANGE

    RANGE --> LEFT
    RANGE --> WIDTH

    LEFT --> PB
    LEFT --> TKB
    WIDTH --> PB
    WIDTH --> TKB
    RANGE --> MH
    RANGE --> TODAY

    style MIN fill:#dbeafe,stroke:#3b82f6
    style MAX fill:#dbeafe,stroke:#3b82f6
    style RANGE fill:#dbeafe,stroke:#3b82f6
    style TODAY fill:#fee2e2,stroke:#ef4444
```

---

## 14. Survey Data Flow *(v0.3.0)*

```mermaid
sequenceDiagram
    participant L as Lead (Browser)
    participant ST as SurveysTab (Client)
    participant API as API Routes
    participant DB as PostgreSQL
    participant AL as ActivityLogger
    participant R as Respondent (Public)

    Note over L,AL: Creating a Survey
    L->>ST: Click "New Survey" → Dialog opens
    L->>ST: Enter title, add questions, click Create
    ST->>API: POST /api/projects/[id]/surveys
    API->>API: Zod validation + auth check
    API->>DB: survey.create({ title, questions: { create: [...] } })
    DB-->>API: Survey record (DRAFT)
    API->>AL: logActivity("SURVEY_CREATED", ...)
    API-->>ST: 201 { survey }

    Note over L,AL: Publishing
    L->>ST: Click "Publish" on draft survey
    ST->>API: POST /api/projects/[id]/surveys/[sId]/publish
    API->>API: Validate DRAFT status + ≥1 question
    API->>DB: survey.update({ status: PUBLISHED, publishedAt })
    API->>AL: logActivity("SURVEY_PUBLISHED", ...)
    API-->>ST: 200 { survey with public link }

    Note over R,DB: Public Response
    R->>API: GET /api/surveys/[sId]/respond
    API->>DB: Fetch survey + questions (PUBLISHED only)
    API-->>R: Survey data (no project info leaked)
    R->>API: POST /api/surveys/[sId]/respond
    API->>API: Validate required questions answered
    API->>DB: surveyResponse.create({ answers: { create: [...] } })
    API->>AL: logActivity("SURVEY_RESPONSE_RECEIVED", ...)
    API-->>R: 201 { success }
```

---

## 15. Survey Lifecycle *(v0.3.0)*

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create survey
    DRAFT --> DRAFT: Add/edit/remove questions
    DRAFT --> DRAFT: Edit title/description
    DRAFT --> PUBLISHED: Publish (≥1 question required)
    PUBLISHED --> CLOSED: Close survey
    DRAFT --> [*]: Delete

    state DRAFT {
        [*] --> Editable
        Editable --> Editable: Modify questions
    }

    state PUBLISHED {
        [*] --> AcceptingResponses
        AcceptingResponses --> AcceptingResponses: Collect responses
    }

    state CLOSED {
        [*] --> ReadOnly
        ReadOnly --> ReadOnly: View results only
    }
```
