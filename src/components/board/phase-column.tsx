"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { TaskCard } from "./task-card"
import type { PhaseData, TaskData } from "./kanban-board"

const phaseStatusColors: Record<string, string> = {
  NOT_STARTED: "bg-slate-300",
  IN_PROGRESS: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
}

interface PhaseColumnProps {
  phase: PhaseData
  projectId: string
  onTaskCreated: (phaseId: string, task: TaskData) => void
  onTaskUpdated: (taskId: string, updates: Partial<TaskData>) => void
  onTaskDeleted: (taskId: string) => void
}

export function PhaseColumn({
  phase,
  projectId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: PhaseColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [loading, setLoading] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: phase.id })

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          projectPhaseId: phase.id,
        }),
      })

      if (!res.ok) {
        toast.error("Failed to create task")
        return
      }

      const task = await res.json()
      onTaskCreated(phase.id, task)
      setNewTaskTitle("")
      setIsAdding(false)
    } catch {
      toast.error("Failed to create task")
    } finally {
      setLoading(false)
    }
  }

  void projectId // used by parent for context

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border bg-slate-50 transition-colors",
        isOver ? "border-primary/50 bg-primary/5" : "border-slate-200"
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              phaseStatusColors[phase.status] || phaseStatusColors.NOT_STARTED
            )}
          />
          <h3 className="text-sm font-semibold text-slate-700">{phase.name}</h3>
        </div>
        <span className="text-xs text-slate-400">{phase.tasks.length}</span>
      </div>

      <SortableContext
        items={phase.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ minHeight: "120px" }}>
          {phase.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdated={onTaskUpdated}
              onDeleted={onTaskDeleted}
            />
          ))}
        </div>
      </SortableContext>

      <div className="border-t border-slate-200 p-3">
        {isAdding ? (
          <form onSubmit={handleAddTask}>
            <Input
              autoFocus
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => {
                if (!newTaskTitle.trim()) setIsAdding(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setIsAdding(false)
              }}
              disabled={loading}
              className="text-sm"
            />
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
        )}
      </div>
    </div>
  )
}
