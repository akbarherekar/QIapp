export const METHODOLOGY_PHASES: Record<string, string[]> = {
  DMAIC: ["Define", "Measure", "Analyze", "Improve", "Control"],
  PDSA: ["Plan", "Do", "Study", "Act"],
  LEAN: [
    "Identify Value",
    "Map Value Stream",
    "Create Flow",
    "Establish Pull",
    "Seek Perfection",
  ],
  SIX_SIGMA: ["Define", "Measure", "Analyze", "Improve", "Control"],
  OTHER: ["Phase 1", "Phase 2", "Phase 3"],
}

export const SYSTEM_ROLE_LEVEL = {
  DIRECTOR: 4,
  PROJECT_LEAD: 3,
  TEAM_MEMBER: 2,
  VIEWER: 1,
} as const

export const PROJECT_ROLE_LEVEL = {
  LEAD: 3,
  MEMBER: 2,
  STAKEHOLDER: 1,
} as const

export const GROUP_ROLE_LEVEL = {
  CHAIR: 3,
  SECRETARY: 2,
  MEMBER: 1,
} as const
