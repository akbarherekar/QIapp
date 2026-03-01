"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Calendar, GripVertical } from "lucide-react"
import { format, isPast, isToday } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import type { TaskData } from "./kanban-board"

const priorityColors: Record<string, string> = {
  HIGH: "border-l-red-500",
  MEDIUM: "border-l-amber-500",
  LOW: "border-l-blue-500",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface TaskCardProps {
  task: TaskData
  isOverlay?: boolean
  onUpdated?: (taskId: string, updates: Partial<TaskData>) => void
  onDeleted?: (taskId: string) => void
}

export function TaskCard({ task, isOverlay, onUpdated, onDeleted }: TaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOverdue =
    task.dueDate &&
    task.status !== "DONE" &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate))

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group cursor-pointer rounded-lg border-l-[3px] bg-white px-3 py-2.5 shadow-sm transition-all hover:shadow-md",
          priorityColors[task.priority] || priorityColors.MEDIUM,
          isDragging && "opacity-50",
          isOverlay && "rotate-2 shadow-lg"
        )}
        onClick={() => !isDragging && setDetailOpen(true)}
      >
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 cursor-grab text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-sm font-medium text-slate-800",
                task.status === "DONE" && "text-slate-400 line-through"
              )}
            >
              {task.title}
            </p>

            <div className="mt-1.5 flex items-center gap-2">
              {task.dueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-[11px]",
                    isOverdue
                      ? "font-medium text-red-500"
                      : "text-slate-400"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {format(new Date(task.dueDate), "MMM d")}
                </span>
              )}

              {task.assignee && (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-slate-100 text-[9px] text-slate-500">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailSheet
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={onUpdated}
        onDeleted={onDeleted}
      />
    </>
  )
}
