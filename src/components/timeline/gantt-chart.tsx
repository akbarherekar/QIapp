"use client"

import { useMemo } from "react"
import {
  format,
  differenceInDays,
  startOfMonth,
  addMonths,
  isBefore,
  isAfter,
} from "date-fns"
import { CalendarDays } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TimelineTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  assignee: { id: string; name: string; avatarUrl: string | null } | null
}

interface TimelinePhase {
  id: string
  name: string
  status: string
  orderIndex: number
  startDate: string | null
  targetDate: string | null
  tasks: TimelineTask[]
}

interface GanttChartProps {
  phases: TimelinePhase[]
  projectStartDate: string | null
  projectEndDate: string | null
}

const taskStatusColors: Record<string, string> = {
  TODO: "bg-slate-300",
  IN_PROGRESS: "bg-blue-400",
  DONE: "bg-emerald-400",
}

const taskStatusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
}

const phaseStatusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 border border-slate-300",
  IN_PROGRESS: "bg-blue-50 border border-blue-300",
  COMPLETED: "bg-emerald-50 border border-emerald-300",
}

const priorityLabels: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
}

export function GanttChart({
  phases,
  projectStartDate,
  projectEndDate,
}: GanttChartProps) {
  const { minDate, maxDate, months, hasAnyDates } = useMemo(() => {
    const allDates: Date[] = []

    if (projectStartDate) allDates.push(new Date(projectStartDate))
    if (projectEndDate) allDates.push(new Date(projectEndDate))

    for (const phase of phases) {
      if (phase.startDate) allDates.push(new Date(phase.startDate))
      if (phase.targetDate) allDates.push(new Date(phase.targetDate))
      for (const task of phase.tasks) {
        if (task.dueDate) allDates.push(new Date(task.dueDate))
        if (task.completedAt) allDates.push(new Date(task.completedAt))
      }
    }

    if (allDates.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), months: [], hasAnyDates: false }
    }

    let min = allDates[0]
    let max = allDates[0]
    for (const d of allDates) {
      if (isBefore(d, min)) min = d
      if (isAfter(d, max)) max = d
    }

    // Pad by 2 weeks on each side
    min = new Date(min.getTime() - 14 * 86400000)
    max = new Date(max.getTime() + 14 * 86400000)

    // Generate month headers
    const months: { label: string; startPercent: number; widthPercent: number }[] = []
    const totalDays = differenceInDays(max, min) || 1
    let current = startOfMonth(min)

    while (isBefore(current, max)) {
      const next = addMonths(current, 1)
      const monthStart = isBefore(current, min) ? min : current
      const monthEnd = isAfter(next, max) ? max : next
      const startPct = (differenceInDays(monthStart, min) / totalDays) * 100
      const widthPct = (differenceInDays(monthEnd, monthStart) / totalDays) * 100

      if (widthPct > 0) {
        months.push({
          label: format(current, "MMM yyyy"),
          startPercent: startPct,
          widthPercent: widthPct,
        })
      }
      current = next
    }

    return { minDate: min, maxDate: max, months, hasAnyDates: true }
  }, [phases, projectStartDate, projectEndDate])

  const todayPercent = useMemo(() => {
    if (!hasAnyDates) return 0
    const totalDays = differenceInDays(maxDate, minDate) || 1
    const daysFromStart = differenceInDays(new Date(), minDate)
    return (daysFromStart / totalDays) * 100
  }, [minDate, maxDate, hasAnyDates])

  if (!hasAnyDates) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">
          No timeline data
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Set start and end dates on the project and phases to see the timeline
          view.
        </p>
      </div>
    )
  }

  function dateToPercent(date: Date): number {
    const totalDays = differenceInDays(maxDate, minDate) || 1
    return (differenceInDays(date, minDate) / totalDays) * 100
  }

  function getTaskBar(task: TimelineTask, phase: TimelinePhase) {
    const phaseStart = phase.startDate
      ? new Date(phase.startDate)
      : projectStartDate
        ? new Date(projectStartDate)
        : null

    if (!task.dueDate) {
      // No due date — show as dot at phase start
      if (!phaseStart) return null
      const left = dateToPercent(phaseStart)
      return { left, width: 0, isDot: true }
    }

    const end = new Date(task.dueDate)
    const start = phaseStart && isBefore(phaseStart, end) ? phaseStart : new Date(end.getTime() - 7 * 86400000)
    const left = dateToPercent(start)
    const right = dateToPercent(end)

    return { left, width: Math.max(right - left, 0.5), isDot: false }
  }

  function getPhaseBar(phase: TimelinePhase) {
    const start = phase.startDate
      ? new Date(phase.startDate)
      : projectStartDate
        ? new Date(projectStartDate)
        : null
    const end = phase.targetDate
      ? new Date(phase.targetDate)
      : projectEndDate
        ? new Date(projectEndDate)
        : null

    if (!start || !end) return null

    const left = dateToPercent(start)
    const right = dateToPercent(end)
    return { left, width: Math.max(right - left, 0.5) }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Month headers */}
        <div className="relative flex h-8 border-b border-slate-100">
          <div className="w-44 shrink-0 border-r border-slate-100" />
          <div className="relative flex-1 overflow-hidden">
            {months.map((month) => (
              <div
                key={month.label}
                className="absolute top-0 flex h-full items-center border-l border-slate-100 px-2"
                style={{
                  left: `${month.startPercent}%`,
                  width: `${month.widthPercent}%`,
                }}
              >
                <span className="truncate text-[10px] font-medium text-slate-400">
                  {month.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Phase rows */}
        {phases.map((phase) => {
          const phaseBar = getPhaseBar(phase)

          return (
            <div key={phase.id} className="border-b border-slate-50 last:border-b-0">
              {/* Phase row */}
              <div className="relative flex h-10 items-center">
                <div className="flex w-44 shrink-0 items-center gap-2 border-r border-slate-100 px-3">
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      phase.status === "COMPLETED"
                        ? "bg-emerald-400"
                        : phase.status === "IN_PROGRESS"
                          ? "bg-blue-400"
                          : "bg-slate-300"
                    )}
                  />
                  <span className="truncate text-xs font-medium text-slate-700">
                    {phase.name}
                  </span>
                </div>
                <div className="relative flex-1">
                  {phaseBar && (
                    <div
                      className={cn(
                        "absolute top-1.5 h-7 rounded",
                        phaseStatusColors[phase.status] || "bg-slate-100"
                      )}
                      style={{
                        left: `${phaseBar.left}%`,
                        width: `${phaseBar.width}%`,
                      }}
                    />
                  )}
                  {/* Today line */}
                  {todayPercent > 0 && todayPercent < 100 && (
                    <div
                      className="absolute top-0 h-full border-l-2 border-dashed border-rose-400 opacity-40"
                      style={{ left: `${todayPercent}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Task rows */}
              {phase.tasks.map((task) => {
                const bar = getTaskBar(task, phase)

                return (
                  <div
                    key={task.id}
                    className="relative flex h-7 items-center"
                  >
                    <div className="w-44 shrink-0 border-r border-slate-100 px-3 pl-8">
                      <span className="block truncate text-[11px] text-slate-500">
                        {task.title}
                      </span>
                    </div>
                    <div className="relative flex-1">
                      {bar && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {bar.isDot ? (
                              <div
                                className={cn(
                                  "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
                                  taskStatusColors[task.status] || "bg-slate-300"
                                )}
                                style={{ left: `${bar.left}%` }}
                              />
                            ) : (
                              <div
                                className={cn(
                                  "absolute top-1.5 h-4 rounded-sm",
                                  taskStatusColors[task.status] || "bg-slate-300"
                                )}
                                style={{
                                  left: `${bar.left}%`,
                                  width: `${bar.width}%`,
                                  minWidth: "6px",
                                }}
                              />
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="font-medium">{task.title}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                              <span>{taskStatusLabels[task.status] || task.status}</span>
                              <span>{priorityLabels[task.priority] || task.priority}</span>
                              {task.assignee && (
                                <span>{task.assignee.name}</span>
                              )}
                              {task.dueDate && (
                                <span>
                                  Due{" "}
                                  {format(new Date(task.dueDate), "MMM d, yyyy")}
                                </span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {/* Today line */}
                      {todayPercent > 0 && todayPercent < 100 && (
                        <div
                          className="absolute top-0 h-full border-l-2 border-dashed border-rose-400 opacity-40"
                          style={{ left: `${todayPercent}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Today legend */}
        <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-0.5 border-l-2 border-dashed border-rose-400" />
            <span className="text-[10px] text-slate-400">Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-slate-300" />
            <span className="text-[10px] text-slate-400">To Do</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
            <span className="text-[10px] text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span className="text-[10px] text-slate-400">Done</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
