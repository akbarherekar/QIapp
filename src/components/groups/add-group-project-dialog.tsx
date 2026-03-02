"use client"

import { useState, useEffect } from "react"
import { FolderKanban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AddGroupProjectDialogProps {
  groupId: string
  existingProjectIds: string[]
}

interface Project {
  id: string
  title: string
  methodology: string
  status: string
}

export function AddGroupProjectDialog({
  groupId,
  existingProjectIds,
}: AddGroupProjectDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setFetchLoading(true)
      fetch("/api/projects")
        .then((r) => r.json())
        .then((data: Project[]) => {
          const existingSet = new Set(existingProjectIds)
          setProjects(data.filter((p: Project) => !existingSet.has(p.id)))
        })
        .catch(() => {})
        .finally(() => setFetchLoading(false))
    }
  }, [open, existingProjectIds])

  async function handleAdd() {
    if (!selectedId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to link project")
      }
      toast.success("Project added to committee")
      setOpen(false)
      setSelectedId("")
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add project"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
          <FolderKanban className="h-3 w-3" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Project to Committee</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : projects.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No available projects to add
            </p>
          ) : (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedId === p.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-slate-400">
                    {p.methodology}
                  </span>
                </button>
              ))}
            </div>
          )}

          <Button
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={!selectedId || loading}
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Add Project"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
