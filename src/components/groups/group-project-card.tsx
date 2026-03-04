"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X } from "lucide-react"
import { toast } from "sonner"
import { ProjectCard } from "@/components/projects/project-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GroupProjectCardProps {
  groupId: string
  canRemove: boolean
  project: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    methodology: string
    department?: string | null
    owner: { name: string; avatarUrl?: string | null }
    members: Array<{
      user: { id: string; name: string; avatarUrl?: string | null }
    }>
    phases: Array<{
      tasks: Array<{ status: string }>
    }>
  }
}

export function GroupProjectCard({
  groupId,
  canRemove,
  project,
}: GroupProjectCardProps) {
  const router = useRouter()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  async function handleRemove() {
    setIsRemoving(true)
    try {
      const res = await fetch(
        `/api/groups/${groupId}/projects/${project.id}`,
        { method: "DELETE" }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to remove project")
      }

      toast.success(`Removed "${project.title}" from committee`)
      setIsConfirmOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove project"
      )
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="group/card relative">
      <ProjectCard project={project} />

      {canRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsConfirmOpen(true)
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-slate-400 opacity-0 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-red-50 hover:text-red-500 hover:ring-red-200 group-hover/card:opacity-100"
          title="Remove from committee"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove Project</DialogTitle>
            <DialogDescription>
              Remove <strong>{project.title}</strong> from this committee? The
              project itself won&apos;t be deleted — it will just be unlinked
              from this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? "Removing…" : "Remove Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
