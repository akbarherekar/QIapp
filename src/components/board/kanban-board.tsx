"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { Search, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhaseColumn } from "./phase-column"
import { TaskCard } from "./task-card"

export interface TaskData {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  orderIndex: number
  projectPhaseId: string
  dueDate?: string | null
  completedAt?: string | null
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null
}

export interface PhaseData {
  id: string
  name: string
  status: string
  orderIndex: number
  tasks: TaskData[]
}

interface KanbanBoardProps {
  phases: PhaseData[]
  projectId: string
}

export function KanbanBoard({ phases: initialPhases, projectId }: KanbanBoardProps) {
  const [phases, setPhases] = useState<PhaseData[]>(initialPhases)
  const [activeTask, setActiveTask] = useState<TaskData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterAssignee, setFilterAssignee] = useState("all")

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    phases.forEach((phase) =>
      phase.tasks.forEach((task) => {
        if (task.assignee) map.set(task.assignee.id, task.assignee)
      })
    )
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [phases])

  const hasFilters =
    searchQuery !== "" ||
    filterPriority !== "all" ||
    filterAssignee !== "all"

  const filteredPhases = useMemo(() => {
    if (!hasFilters) return phases
    return phases.map((phase) => ({
      ...phase,
      tasks: phase.tasks.filter((task) => {
        if (
          searchQuery &&
          !task.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false
        }
        if (filterPriority !== "all" && task.priority !== filterPriority) {
          return false
        }
        if (filterAssignee !== "all" && task.assignee?.id !== filterAssignee) {
          return false
        }
        return true
      }),
    }))
  }, [phases, searchQuery, filterPriority, filterAssignee, hasFilters])

  function clearFilters() {
    setSearchQuery("")
    setFilterPriority("all")
    setFilterAssignee("all")
  }

  const findPhaseByTaskId = useCallback(
    (taskId: string) => {
      return phases.find((phase) =>
        phase.tasks.some((task) => task.id === taskId)
      )
    },
    [phases]
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const phase = findPhaseByTaskId(active.id as string)
    const task = phase?.tasks.find((t) => t.id === active.id)
    if (task) setActiveTask(task)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activePhase = findPhaseByTaskId(activeId)
    const overPhase =
      findPhaseByTaskId(overId) ||
      phases.find((p) => p.id === overId)

    if (!activePhase || !overPhase || activePhase.id === overPhase.id) return

    setPhases((prev) => {
      const activeTask = activePhase.tasks.find((t) => t.id === activeId)
      if (!activeTask) return prev

      return prev.map((phase) => {
        if (phase.id === activePhase.id) {
          return {
            ...phase,
            tasks: phase.tasks.filter((t) => t.id !== activeId),
          }
        }
        if (phase.id === overPhase.id) {
          const overIndex = phase.tasks.findIndex((t) => t.id === overId)
          const insertIndex = overIndex >= 0 ? overIndex : phase.tasks.length
          const newTasks = [...phase.tasks]
          newTasks.splice(insertIndex, 0, {
            ...activeTask,
            projectPhaseId: phase.id,
          })
          return { ...phase, tasks: newTasks }
        }
        return phase
      })
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Find the phase containing the task after the move
    let finalPhases = phases
    const activePhase = finalPhases.find((p) =>
      p.tasks.some((t) => t.id === activeId)
    )

    if (!activePhase) return

    // Reorder within the same phase
    const overIndex = activePhase.tasks.findIndex((t) => t.id === overId)
    const activeIndex = activePhase.tasks.findIndex((t) => t.id === activeId)

    if (overIndex >= 0 && activeIndex >= 0 && activePhase) {
      const newTasks = [...activePhase.tasks]
      const [moved] = newTasks.splice(activeIndex, 1)
      newTasks.splice(overIndex, 0, moved)

      finalPhases = finalPhases.map((p) =>
        p.id === activePhase.id ? { ...p, tasks: newTasks } : p
      )
      setPhases(finalPhases)
    }

    // Build reorder payload from all affected phases
    const tasksToUpdate: Array<{
      id: string
      projectPhaseId: string
      orderIndex: number
    }> = []

    finalPhases.forEach((phase) => {
      phase.tasks.forEach((task, index) => {
        tasksToUpdate.push({
          id: task.id,
          projectPhaseId: phase.id,
          orderIndex: index,
        })
      })
    })

    try {
      const res = await fetch("/api/tasks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: tasksToUpdate }),
      })

      if (!res.ok) {
        toast.error("Failed to save task order")
        setPhases(initialPhases)
      }
    } catch {
      toast.error("Failed to save task order")
      setPhases(initialPhases)
    }
  }

  function handleTaskCreated(phaseId: string, task: TaskData) {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id === phaseId
          ? { ...phase, tasks: [...phase.tasks, task] }
          : phase
      )
    )
  }

  function handleTaskUpdated(taskId: string, updates: Partial<TaskData>) {
    setPhases((prev) =>
      prev.map((phase) => ({
        ...phase,
        tasks: phase.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        ),
      }))
    )
  }

  function handleTaskDeleted(taskId: string) {
    setPhases((prev) =>
      prev.map((phase) => ({
        ...phase,
        tasks: phase.tasks.filter((t) => t.id !== taskId),
      }))
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All assignees</SelectItem>
            {uniqueAssignees.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-slate-500"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {filteredPhases.map((phase) => (
            <PhaseColumn
              key={phase.id}
              phase={phase}
              projectId={projectId}
              onTaskCreated={handleTaskCreated}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={handleTaskDeleted}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
