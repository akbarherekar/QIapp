import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // Clean existing data
  await prisma.surveyAnswer.deleteMany()
  await prisma.surveyResponse.deleteMany()
  await prisma.surveyQuestion.deleteMany()
  await prisma.survey.deleteMany()
  await prisma.metricDataPoint.deleteMany()
  await prisma.metricDefinition.deleteMany()
  await prisma.inboxAction.deleteMany()
  await prisma.inboxMessage.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectPhase.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("password123", 12)

  // Create users
  const director = await prisma.user.create({
    data: {
      email: "sarah.chen@hospital.org",
      name: "Dr. Sarah Chen",
      hashedPassword: password,
      role: "DIRECTOR",
      department: "Quality Improvement",
    },
  })

  const lead = await prisma.user.create({
    data: {
      email: "james.wilson@hospital.org",
      name: "James Wilson",
      hashedPassword: password,
      role: "PROJECT_LEAD",
      department: "ICU",
    },
  })

  const member = await prisma.user.create({
    data: {
      email: "maria.garcia@hospital.org",
      name: "Maria Garcia",
      hashedPassword: password,
      role: "TEAM_MEMBER",
      department: "Infection Prevention",
    },
  })

  const viewer = await prisma.user.create({
    data: {
      email: "david.kim@hospital.org",
      name: "David Kim",
      hashedPassword: password,
      role: "VIEWER",
      department: "Administration",
    },
  })

  console.log("Created 4 users")

  // Project 1: CAUTI Reduction (PDSA, Active)
  const project1 = await prisma.project.create({
    data: {
      title: "Reduce CAUTI Rate in ICU",
      description:
        "Implement evidence-based catheter care bundle to reduce catheter-associated urinary tract infections in the medical ICU.",
      status: "ACTIVE",
      priority: "HIGH",
      methodology: "PDSA",
      department: "ICU",
      unit: "Medical ICU",
      targetMetric: "CAUTI rate per 1,000 catheter days",
      baselineValue: "3.2",
      goalValue: "1.5",
      startDate: new Date("2026-01-15"),
      targetEndDate: new Date("2026-06-15"),
      ownerId: lead.id,
      inboxShortcode: "cauti-icu",
    },
  })

  // PDSA phases for project 1 (with dates for Gantt timeline)
  const p1PhaseDates = [
    { startDate: new Date("2026-01-15"), targetDate: new Date("2026-02-15") },
    { startDate: new Date("2026-02-15"), targetDate: new Date("2026-03-31") },
    { startDate: new Date("2026-04-01"), targetDate: new Date("2026-05-15") },
    { startDate: new Date("2026-05-15"), targetDate: new Date("2026-06-15") },
  ]
  const p1Phases = await Promise.all(
    ["Plan", "Do", "Study", "Act"].map((name, i) =>
      prisma.projectPhase.create({
        data: {
          projectId: project1.id,
          name,
          orderIndex: i,
          status: i === 0 ? "COMPLETED" : i === 1 ? "IN_PROGRESS" : "NOT_STARTED",
          startDate: p1PhaseDates[i].startDate,
          targetDate: p1PhaseDates[i].targetDate,
        },
      })
    )
  )

  // Members for project 1
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: lead.id, role: "LEAD" },
      { projectId: project1.id, userId: director.id, role: "STAKEHOLDER" },
      { projectId: project1.id, userId: member.id, role: "MEMBER" },
      { projectId: project1.id, userId: viewer.id, role: "STAKEHOLDER" },
    ],
  })

  // Tasks for project 1 (with dueDates for Gantt timeline)
  const p1Tasks = [
    { title: "Review current CAUTI data", phaseIdx: 0, status: "DONE" as const, priority: "HIGH" as const, assigneeId: lead.id, dueDate: new Date("2026-01-31") },
    { title: "Literature review of CAUTI bundles", phaseIdx: 0, status: "DONE" as const, priority: "HIGH" as const, assigneeId: member.id, dueDate: new Date("2026-02-07") },
    { title: "Map current catheter insertion process", phaseIdx: 0, status: "DONE" as const, priority: "MEDIUM" as const, assigneeId: member.id, dueDate: new Date("2026-02-14") },
    { title: "Draft CAUTI prevention bundle", phaseIdx: 1, status: "DONE" as const, priority: "HIGH" as const, assigneeId: lead.id, dueDate: new Date("2026-02-28") },
    { title: "Train ICU nurses on bundle protocol", phaseIdx: 1, status: "IN_PROGRESS" as const, priority: "HIGH" as const, assigneeId: member.id, dueDate: new Date("2026-03-15") },
    { title: "Implement daily catheter necessity review", phaseIdx: 1, status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: lead.id, dueDate: new Date("2026-03-25") },
    { title: "Create compliance monitoring checklist", phaseIdx: 1, status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: member.id, dueDate: new Date("2026-03-31") },
    { title: "Analyze 30-day post-implementation data", phaseIdx: 2, status: "TODO" as const, priority: "HIGH" as const, assigneeId: lead.id, dueDate: new Date("2026-04-30") },
    { title: "Compare CAUTI rates pre/post intervention", phaseIdx: 2, status: "TODO" as const, priority: "HIGH" as const, assigneeId: null, dueDate: new Date("2026-05-10") },
    { title: "Roll out to all ICU beds", phaseIdx: 3, status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: null, dueDate: new Date("2026-06-10") },
  ]

  for (let i = 0; i < p1Tasks.length; i++) {
    const t = p1Tasks[i]
    await prisma.task.create({
      data: {
        title: t.title,
        projectPhaseId: p1Phases[t.phaseIdx].id,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId,
        orderIndex: i,
        dueDate: t.dueDate,
        completedAt: t.status === "DONE" ? new Date() : null,
      },
    })
  }

  // Project 2: Discharge Process (DMAIC, Active)
  const project2 = await prisma.project.create({
    data: {
      title: "Improve Patient Discharge Process",
      description:
        "Reduce time from discharge order to patient leaving and improve discharge instruction comprehension.",
      status: "ACTIVE",
      priority: "MEDIUM",
      methodology: "DMAIC",
      department: "Med-Surg",
      unit: "4 North",
      targetMetric: "Average discharge time (hours)",
      baselineValue: "4.5",
      goalValue: "2.0",
      startDate: new Date("2026-02-01"),
      targetEndDate: new Date("2026-08-01"),
      ownerId: director.id,
      inboxShortcode: "discharge-process",
    },
  })

  // DMAIC phases for project 2 (with dates for Gantt timeline)
  const p2PhaseDates = [
    { startDate: new Date("2026-02-01"), targetDate: new Date("2026-03-01") },
    { startDate: new Date("2026-03-01"), targetDate: new Date("2026-04-01") },
    { startDate: new Date("2026-04-01"), targetDate: new Date("2026-05-15") },
    { startDate: new Date("2026-05-15"), targetDate: new Date("2026-07-01") },
    { startDate: new Date("2026-07-01"), targetDate: new Date("2026-08-01") },
  ]
  const p2Phases = await Promise.all(
    ["Define", "Measure", "Analyze", "Improve", "Control"].map((name, i) =>
      prisma.projectPhase.create({
        data: {
          projectId: project2.id,
          name,
          orderIndex: i,
          status: i === 0 ? "COMPLETED" : i === 1 ? "IN_PROGRESS" : "NOT_STARTED",
          startDate: p2PhaseDates[i].startDate,
          targetDate: p2PhaseDates[i].targetDate,
        },
      })
    )
  )

  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: director.id, role: "LEAD" },
      { projectId: project2.id, userId: lead.id, role: "MEMBER" },
      { projectId: project2.id, userId: member.id, role: "MEMBER" },
    ],
  })

  const p2Tasks = [
    { title: "Define project scope and goals", phaseIdx: 0, status: "DONE" as const, priority: "HIGH" as const, assigneeId: director.id, dueDate: new Date("2026-02-14") },
    { title: "Identify key stakeholders", phaseIdx: 0, status: "DONE" as const, priority: "MEDIUM" as const, assigneeId: director.id, dueDate: new Date("2026-02-21") },
    { title: "Collect baseline discharge time data", phaseIdx: 1, status: "DONE" as const, priority: "HIGH" as const, assigneeId: lead.id, dueDate: new Date("2026-03-14") },
    { title: "Survey patients on discharge experience", phaseIdx: 1, status: "IN_PROGRESS" as const, priority: "MEDIUM" as const, assigneeId: member.id, dueDate: new Date("2026-03-21") },
    { title: "Map current discharge workflow", phaseIdx: 1, status: "TODO" as const, priority: "HIGH" as const, assigneeId: lead.id, dueDate: new Date("2026-03-28") },
    { title: "Root cause analysis of delays", phaseIdx: 2, status: "TODO" as const, priority: "HIGH" as const, assigneeId: null, dueDate: new Date("2026-04-30") },
    { title: "Design improved discharge checklist", phaseIdx: 3, status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: null, dueDate: new Date("2026-06-15") },
    { title: "Establish monitoring dashboard", phaseIdx: 4, status: "TODO" as const, priority: "MEDIUM" as const, assigneeId: null, dueDate: new Date("2026-07-15") },
  ]

  for (let i = 0; i < p2Tasks.length; i++) {
    const t = p2Tasks[i]
    await prisma.task.create({
      data: {
        title: t.title,
        projectPhaseId: p2Phases[t.phaseIdx].id,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId,
        orderIndex: i,
        dueDate: t.dueDate,
        completedAt: t.status === "DONE" ? new Date() : null,
      },
    })
  }

  // Project 3: Medication Reconciliation (LEAN, Planning)
  const project3 = await prisma.project.create({
    data: {
      title: "Medication Reconciliation Improvement",
      description:
        "Streamline the medication reconciliation process at admission and discharge to reduce medication errors.",
      status: "PLANNING",
      priority: "MEDIUM",
      methodology: "LEAN",
      department: "Pharmacy",
      targetMetric: "Medication discrepancy rate",
      baselineValue: "12%",
      goalValue: "3%",
      ownerId: director.id,
      inboxShortcode: "med-rec",
    },
  })

  await Promise.all(
    [
      "Identify Value",
      "Map Value Stream",
      "Create Flow",
      "Establish Pull",
      "Seek Perfection",
    ].map((name, i) =>
      prisma.projectPhase.create({
        data: {
          projectId: project3.id,
          name,
          orderIndex: i,
          status: "NOT_STARTED",
        },
      })
    )
  )

  await prisma.projectMember.createMany({
    data: [
      { projectId: project3.id, userId: director.id, role: "LEAD" },
      { projectId: project3.id, userId: lead.id, role: "STAKEHOLDER" },
    ],
  })

  // Activity logs
  const activities = [
    { projectId: project1.id, userId: lead.id, action: "PROJECT_CREATED", details: 'Created project "Reduce CAUTI Rate in ICU" using PDSA methodology', daysAgo: 44 },
    { projectId: project1.id, userId: member.id, action: "TASK_COMPLETED", details: "Completed task: Review current CAUTI data", daysAgo: 38 },
    { projectId: project1.id, userId: member.id, action: "TASK_COMPLETED", details: "Completed task: Literature review of CAUTI bundles", daysAgo: 30 },
    { projectId: project1.id, userId: lead.id, action: "PHASE_STATUS_CHANGED", details: 'Changed "Plan" from NOT_STARTED to COMPLETED', daysAgo: 25 },
    { projectId: project1.id, userId: lead.id, action: "TASK_COMPLETED", details: "Completed task: Draft CAUTI prevention bundle", daysAgo: 15 },
    { projectId: project1.id, userId: member.id, action: "TASK_STATUS_CHANGED", details: 'Changed task "Train ICU nurses on bundle protocol" status to IN_PROGRESS', daysAgo: 10 },
    { projectId: project2.id, userId: director.id, action: "PROJECT_CREATED", details: 'Created project "Improve Patient Discharge Process" using DMAIC methodology', daysAgo: 27 },
    { projectId: project2.id, userId: director.id, action: "TASK_COMPLETED", details: "Completed task: Define project scope and goals", daysAgo: 20 },
    { projectId: project2.id, userId: lead.id, action: "TASK_COMPLETED", details: "Completed task: Collect baseline discharge time data", daysAgo: 12 },
    { projectId: project2.id, userId: member.id, action: "MEMBER_ADDED", details: "Added Maria Garcia as MEMBER", daysAgo: 5 },
    { projectId: project3.id, userId: director.id, action: "PROJECT_CREATED", details: 'Created project "Medication Reconciliation Improvement" using LEAN methodology', daysAgo: 3 },
  ]

  for (const a of activities) {
    const date = new Date()
    date.setDate(date.getDate() - a.daysAgo)
    await prisma.activityLog.create({
      data: {
        projectId: a.projectId,
        userId: a.userId,
        action: a.action,
        details: a.details,
        source: "SYSTEM",
        createdAt: date,
      },
    })
  }

  // Inbox messages for project 1 (CAUTI)
  const inboxMsg1 = await prisma.inboxMessage.create({
    data: {
      projectId: project1.id,
      senderId: member.id,
      channel: "MANUAL",
      status: "REVIEWED",
      senderIdentifier: "maria.garcia@hospital.org",
      subject: "Nurse training update",
      rawBody:
        "Completed training for 3 more nurses on the catheter bundle protocol today (Maria, John, and Priya). We've now trained 8 out of 12 ICU nurses. The remaining 4 are scheduled for next Tuesday. Also noticed compliance with the daily review checklist has been inconsistent — only about 60% of patients had their catheter necessity reviewed yesterday.",
      processedSummary:
        "Training progress update: 8/12 ICU nurses trained on catheter bundle. 4 remaining scheduled for next Tuesday. Compliance concern flagged — daily catheter necessity review at only 60%.",
      classification: "STATUS_UPDATE",
      llmResponse: {
        classification: "STATUS_UPDATE",
        summary:
          "Training progress update: 8/12 ICU nurses trained on catheter bundle. 4 remaining scheduled for next Tuesday. Compliance concern flagged.",
        actions: [
          {
            actionType: "ADD_NOTE",
            description: "Log training progress note",
            data: { note: "8/12 ICU nurses trained on catheter bundle protocol. Remaining 4 scheduled for next Tuesday." },
          },
          {
            actionType: "CREATE_TASK",
            description: "Create task to address compliance gap",
            data: { title: "Address daily catheter review compliance (currently 60%)", phase: "Do", priority: "HIGH" },
          },
        ],
      },
      processedAt: new Date(),
    },
  })

  await prisma.inboxAction.createMany({
    data: [
      {
        inboxMessageId: inboxMsg1.id,
        actionType: "ADD_NOTE",
        status: "PENDING",
        description: "Log training progress: 8/12 ICU nurses trained on catheter bundle protocol",
        extractedData: { note: "8/12 ICU nurses trained on catheter bundle protocol. Remaining 4 scheduled for next Tuesday." },
      },
      {
        inboxMessageId: inboxMsg1.id,
        actionType: "CREATE_TASK",
        status: "PENDING",
        description: "Create task: Address daily catheter review compliance (currently 60%)",
        extractedData: { title: "Address daily catheter review compliance (currently 60%)", phase: "Do", priority: "HIGH" },
      },
    ],
  })

  const inboxMsg2 = await prisma.inboxMessage.create({
    data: {
      projectId: project1.id,
      senderId: lead.id,
      channel: "MANUAL",
      status: "APPLIED",
      senderIdentifier: "james.wilson@hospital.org",
      subject: "Meeting notes — CAUTI review",
      rawBody:
        "Had a quick huddle with the ICU charge nurse. She confirmed the catheter removal criteria poster is now posted in all 12 bays. We agreed to start the daily rounding checklist pilot starting Monday. I'll own the data collection for the first week.",
      processedSummary:
        "Catheter removal criteria posters installed in all 12 ICU bays. Daily rounding checklist pilot starts Monday. James will own first week of data collection.",
      classification: "MEETING_NOTES",
      llmResponse: {
        classification: "MEETING_NOTES",
        summary: "Posters installed, rounding checklist pilot starts Monday.",
        actions: [
          {
            actionType: "COMPLETE_TASK",
            description: "Mark poster installation as complete",
            data: { taskTitle: "Create compliance monitoring checklist" },
          },
          {
            actionType: "ADD_NOTE",
            description: "Log meeting outcome",
            data: { note: "Daily rounding checklist pilot starts Monday. James Wilson leading first week of data collection." },
          },
        ],
      },
      processedAt: new Date(Date.now() - 2 * 86400000),
      reviewedAt: new Date(Date.now() - 86400000),
    },
  })

  await prisma.inboxAction.createMany({
    data: [
      {
        inboxMessageId: inboxMsg2.id,
        actionType: "COMPLETE_TASK",
        status: "APPROVED",
        description: "Mark task as complete: Create compliance monitoring checklist",
        extractedData: { taskTitle: "Create compliance monitoring checklist" },
        appliedData: { taskId: "matched", newStatus: "DONE" },
        appliedAt: new Date(Date.now() - 86400000),
      },
      {
        inboxMessageId: inboxMsg2.id,
        actionType: "ADD_NOTE",
        status: "APPROVED",
        description: "Log: Daily rounding checklist pilot starts Monday",
        extractedData: { note: "Daily rounding checklist pilot starts Monday. James Wilson leading first week of data collection." },
        appliedAt: new Date(Date.now() - 86400000),
      },
    ],
  })

  // Inbox message for project 2 (Discharge)
  const inboxMsg3 = await prisma.inboxMessage.create({
    data: {
      projectId: project2.id,
      senderId: member.id,
      channel: "MANUAL",
      status: "REVIEWED",
      senderIdentifier: "maria.garcia@hospital.org",
      rawBody:
        "Patient survey results are in — 47 responses so far. Main themes: patients don't understand their discharge meds (68%), wait times for pharmacy are the biggest bottleneck (avg 45 min), and families want more advance notice before discharge. I think we should create a pre-discharge checklist that starts 24 hours before anticipated discharge.",
      processedSummary:
        "Survey results (47 responses): 68% don't understand discharge meds, pharmacy wait averages 45 min, families want advance notice. Suggests a 24-hour pre-discharge checklist.",
      classification: "DATA_UPDATE",
      llmResponse: {
        classification: "DATA_UPDATE",
        summary: "Survey results with key themes around medication understanding and pharmacy bottleneck.",
        actions: [
          {
            actionType: "UPDATE_TASK",
            description: "Update patient survey task with results",
            data: { taskTitle: "Survey patients on discharge experience", note: "47 responses collected. Key findings: 68% medication confusion, 45min pharmacy wait, advance notice needed." },
          },
          {
            actionType: "CREATE_TASK",
            description: "Create task for pre-discharge checklist",
            data: { title: "Design 24-hour pre-discharge checklist", phase: "Improve", priority: "HIGH" },
          },
        ],
      },
      processedAt: new Date(Date.now() - 3600000),
    },
  })

  await prisma.inboxAction.createMany({
    data: [
      {
        inboxMessageId: inboxMsg3.id,
        actionType: "UPDATE_TASK",
        status: "PENDING",
        description: "Update task: Survey patients on discharge experience — add results summary",
        extractedData: { taskTitle: "Survey patients on discharge experience", note: "47 responses. Key findings: 68% med confusion, 45min pharmacy wait." },
      },
      {
        inboxMessageId: inboxMsg3.id,
        actionType: "CREATE_TASK",
        status: "PENDING",
        description: "Create task: Design 24-hour pre-discharge checklist",
        extractedData: { title: "Design 24-hour pre-discharge checklist", phase: "Improve", priority: "HIGH" },
      },
    ],
  })

  console.log("Created sample inbox messages with actions")

  // Sample metrics with data points
  const cautiMetric = await prisma.metricDefinition.create({
    data: {
      projectId: project1.id,
      name: "CAUTI Rate",
      unit: "per 1,000 catheter days",
      target: 1.5,
      upperBound: 4.0,
      lowerBound: 0,
    },
  })

  const cautiDataPoints = [
    { value: 3.2, daysAgo: 42 },
    { value: 3.5, daysAgo: 35 },
    { value: 2.8, daysAgo: 28 },
    { value: 2.4, daysAgo: 21 },
    { value: 2.1, daysAgo: 14 },
    { value: 1.9, daysAgo: 7 },
    { value: 1.7, daysAgo: 0 },
  ]

  for (const dp of cautiDataPoints) {
    const date = new Date()
    date.setDate(date.getDate() - dp.daysAgo)
    await prisma.metricDataPoint.create({
      data: {
        metricId: cautiMetric.id,
        value: dp.value,
        recordedAt: date,
        recordedById: lead.id,
      },
    })
  }

  const complianceMetric = await prisma.metricDefinition.create({
    data: {
      projectId: project1.id,
      name: "Bundle Compliance Rate",
      unit: "%",
      target: 95,
      upperBound: 100,
      lowerBound: 50,
    },
  })

  const complianceDataPoints = [
    { value: 45, daysAgo: 42 },
    { value: 52, daysAgo: 35 },
    { value: 61, daysAgo: 28 },
    { value: 70, daysAgo: 21 },
    { value: 78, daysAgo: 14 },
    { value: 82, daysAgo: 7 },
    { value: 88, daysAgo: 0 },
  ]

  for (const dp of complianceDataPoints) {
    const date = new Date()
    date.setDate(date.getDate() - dp.daysAgo)
    await prisma.metricDataPoint.create({
      data: {
        metricId: complianceMetric.id,
        value: dp.value,
        recordedAt: date,
        recordedById: member.id,
      },
    })
  }

  const dischargeMetric = await prisma.metricDefinition.create({
    data: {
      projectId: project2.id,
      name: "Average Discharge Time",
      unit: "hours",
      target: 2.0,
      upperBound: 6.0,
      lowerBound: 0.5,
    },
  })

  const dischargeDataPoints = [
    { value: 4.5, daysAgo: 21 },
    { value: 4.2, daysAgo: 14 },
    { value: 3.8, daysAgo: 7 },
    { value: 3.5, daysAgo: 0 },
  ]

  for (const dp of dischargeDataPoints) {
    const date = new Date()
    date.setDate(date.getDate() - dp.daysAgo)
    await prisma.metricDataPoint.create({
      data: {
        metricId: dischargeMetric.id,
        value: dp.value,
        recordedAt: date,
        recordedById: director.id,
      },
    })
  }

  console.log("Created sample metrics with data points")

  // ── Sample Surveys ───────────────────────────────────

  // Survey 1: Patient Discharge Experience (PUBLISHED, on project 2)
  const dischargeSurvey = await prisma.survey.create({
    data: {
      projectId: project2.id,
      title: "Patient Discharge Experience Survey",
      description: "Help us improve the discharge process by sharing your experience. Your responses are anonymous and will be used to identify areas for improvement.",
      status: "PUBLISHED",
      createdById: director.id,
      publishedAt: new Date(Date.now() - 14 * 86400000),
    },
  })

  const dsQuestions = await Promise.all([
    prisma.surveyQuestion.create({
      data: {
        surveyId: dischargeSurvey.id,
        text: "Overall, how would you rate your discharge experience?",
        type: "RATING",
        required: true,
        orderIndex: 0,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: dischargeSurvey.id,
        text: "Did you understand all your discharge medications?",
        type: "YES_NO",
        required: true,
        orderIndex: 1,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: dischargeSurvey.id,
        text: "How satisfied were you with the wait time before discharge?",
        type: "LIKERT_SCALE",
        required: true,
        orderIndex: 2,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: dischargeSurvey.id,
        text: "What was your biggest concern during discharge?",
        type: "MULTIPLE_CHOICE",
        required: true,
        options: ["Understanding medications", "Wait time", "Follow-up instructions", "Transportation"],
        orderIndex: 3,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: dischargeSurvey.id,
        text: "Any additional comments or suggestions?",
        type: "TEXT",
        required: false,
        orderIndex: 4,
      },
    }),
  ])

  // 8 sample responses
  const sampleResponses = [
    { name: "Patient A", rating: "4", medUnderstand: "Yes", waitSat: "Agree", concern: "Follow-up instructions", comment: "Nurse was very helpful explaining everything." },
    { name: "Patient B", rating: "2", medUnderstand: "No", waitSat: "Disagree", concern: "Understanding medications", comment: "Had to wait 2 hours after discharge order." },
    { name: null, rating: "5", medUnderstand: "Yes", waitSat: "Strongly Agree", concern: "Transportation", comment: "" },
    { name: "Patient D", rating: "3", medUnderstand: "No", waitSat: "Neutral", concern: "Understanding medications", comment: "Too many new medications without clear instructions." },
    { name: null, rating: "4", medUnderstand: "Yes", waitSat: "Agree", concern: "Wait time", comment: "" },
    { name: "Patient F", rating: "1", medUnderstand: "No", waitSat: "Strongly Disagree", concern: "Wait time", comment: "Worst experience. Waited 3 hours and nobody explained my meds." },
    { name: "Patient G", rating: "4", medUnderstand: "Yes", waitSat: "Agree", concern: "Follow-up instructions", comment: "Good overall but would like more advance notice." },
    { name: null, rating: "3", medUnderstand: "No", waitSat: "Neutral", concern: "Understanding medications", comment: "" },
  ]

  for (let i = 0; i < sampleResponses.length; i++) {
    const r = sampleResponses[i]
    const submitDate = new Date()
    submitDate.setDate(submitDate.getDate() - (sampleResponses.length - i))

    await prisma.surveyResponse.create({
      data: {
        surveyId: dischargeSurvey.id,
        respondentName: r.name,
        submittedAt: submitDate,
        answers: {
          create: [
            { questionId: dsQuestions[0].id, value: r.rating },
            { questionId: dsQuestions[1].id, value: r.medUnderstand },
            { questionId: dsQuestions[2].id, value: r.waitSat },
            { questionId: dsQuestions[3].id, value: r.concern },
            ...(r.comment ? [{ questionId: dsQuestions[4].id, value: r.comment }] : []),
          ],
        },
      },
    })
  }

  // Survey 2: ICU Nurse Assessment (DRAFT, on project 1)
  const nurseSurvey = await prisma.survey.create({
    data: {
      projectId: project1.id,
      title: "ICU Nurse CAUTI Bundle Assessment",
      description: "Assess nurse knowledge and satisfaction with the CAUTI prevention bundle training program.",
      status: "DRAFT",
      createdById: lead.id,
    },
  })

  await Promise.all([
    prisma.surveyQuestion.create({
      data: {
        surveyId: nurseSurvey.id,
        text: "How would you rate the quality of the CAUTI bundle training?",
        type: "RATING",
        required: true,
        orderIndex: 0,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: nurseSurvey.id,
        text: "The catheter care protocol is clear and easy to follow.",
        type: "LIKERT_SCALE",
        required: true,
        orderIndex: 1,
      },
    }),
    prisma.surveyQuestion.create({
      data: {
        surveyId: nurseSurvey.id,
        text: "What suggestions do you have for improving the training program?",
        type: "TEXT",
        required: false,
        orderIndex: 2,
      },
    }),
  ])

  console.log("Created sample surveys with questions and responses")

  console.log("Created 3 projects with tasks and activity logs")
  console.log("\nSeed complete! Login credentials:")
  console.log("  Director:     sarah.chen@hospital.org / password123")
  console.log("  Project Lead: james.wilson@hospital.org / password123")
  console.log("  Team Member:  maria.garcia@hospital.org / password123")
  console.log("  Viewer:       david.kim@hospital.org / password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
