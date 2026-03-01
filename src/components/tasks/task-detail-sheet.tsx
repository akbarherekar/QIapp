"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaskData } from "@/components/board/kanban-board"

interface TaskDetailSheetProps {
  task: TaskData
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (taskId: string, updates: Partial<TaskData>) => void
  onDeleted?: (taskId: string) => void
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description || "")
  }, [task.title, task.description])

  const saveField = useCallback(
    async (field: string, value: unknown) => {
      try {
        const res = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        })

        if (!res.ok) {
          toast.error("Failed to update task")
          return
        }

        const updated = await res.json()
        onUpdated?.(task.id, updated)
      } catch {
        toast.error("Failed to update task")
      }
    },
    [task.id, onUpdated]
  )

  function debouncedSave(field: string, value: unknown) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveField(field, value), 300)
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Failed to delete task")
        return
      }
      toast.success("Task deleted")
      onDeleted?.(task.id)
      onOpenChange(false)
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const statusLabel: Record<string, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] overflow-y-auto sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="sr-only">Task Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 pt-4">
          <div>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                debouncedSave("title", e.target.value)
              }}
              className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              placeholder="Task title"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">Status</Label>
              <Select
                value={task.status}
                onValueChange={(v) => saveField("status", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-slate-500">Priority</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => saveField("priority", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Low
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Due date</Label>
            <Input
              type="date"
              value={
                task.dueDate
                  ? new Date(task.dueDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null
                saveField("dueDate", val)
              }}
              className="h-8 text-sm"
            />
          </div>

          {task.assignee && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">Assignee</Label>
              <Badge variant="secondary" className="text-xs">
                {task.assignee.name}
              </Badge>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                debouncedSave("description", e.target.value)
              }}
              placeholder="Add a description..."
              rows={5}
              className="text-sm"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={handleDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete task
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
