"use client"

import { useState, useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface CalendarTask {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
  assignee: { id: string; name: string; avatarUrl?: string | null } | null
  projectTitle: string
  projectId: string
  phaseName: string
}

const priorityDot: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-blue-500",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function CalendarView({ tasks }: { tasks: CalendarTask[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const tasksByDate = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const task of tasks) {
      const key = format(new Date(task.dueDate), "yyyy-MM-dd")
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(task)
    }
    return map
  }, [tasks])

  const selectedTasks = selectedDate
    ? tasksByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : []

  return (
    <div className="flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Month header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setCurrentMonth(new Date())
                  setSelectedDate(new Date())
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="px-2 py-2 text-center text-xs font-medium text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayTasks = tasksByDate.get(key) || []
              const inMonth = isSameMonth(day, currentMonth)
              const selected = selectedDate && isSameDay(day, selectedDate)
              const today = isToday(day)

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-slate-50",
                    !inMonth && "bg-slate-50/50",
                    selected && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs",
                      !inMonth && "text-slate-300",
                      inMonth && "text-slate-700",
                      today &&
                        "bg-primary font-semibold text-primary-foreground",
                      selected && !today && "font-semibold text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Task dots */}
                  {dayTasks.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      {dayTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            t.status === "DONE"
                              ? "bg-slate-300"
                              : priorityDot[t.priority] || "bg-slate-400"
                          )}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-slate-400">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      <div className="w-72 shrink-0">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            {selectedDate
              ? format(selectedDate, "EEEE, MMM d")
              : "Select a date"}
          </h3>

          {selectedDate && selectedTasks.length === 0 && (
            <p className="mt-3 text-sm text-slate-400">
              No tasks due this day
            </p>
          )}

          {selectedTasks.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/projects/${task.projectId}`}
                  className="block"
                >
                  <div
                    className={cn(
                      "rounded-lg border-l-[3px] bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100",
                      task.status === "DONE"
                        ? "border-l-slate-300"
                        : task.priority === "HIGH"
                          ? "border-l-red-500"
                          : task.priority === "MEDIUM"
                            ? "border-l-amber-500"
                            : "border-l-blue-500"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.status === "DONE"
                          ? "text-slate-400 line-through"
                          : "text-slate-800"
                      )}
                    >
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {task.projectTitle} &middot; {task.phaseName}
                    </p>
                    {task.assignee && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="bg-slate-200 text-[7px] text-slate-500">
                            {getInitials(task.assignee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-slate-400">
                          {task.assignee.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
