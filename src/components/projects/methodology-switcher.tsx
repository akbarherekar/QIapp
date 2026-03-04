"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const METHODOLOGIES = [
  { value: "PDSA", label: "PDSA" },
  { value: "DMAIC", label: "DMAIC" },
  { value: "LEAN", label: "LEAN" },
  { value: "SIX_SIGMA", label: "Six Sigma" },
  { value: "OTHER", label: "Other" },
]

interface MethodologySwitcherProps {
  projectId: string
  currentMethodology: string
  canEdit: boolean
}

export function MethodologySwitcher({
  projectId,
  currentMethodology,
  canEdit,
}: MethodologySwitcherProps) {
  const router = useRouter()
  const [pendingMethodology, setPendingMethodology] = useState<string | null>(
    null
  )
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!canEdit) return null

  function handleValueChange(value: string) {
    if (value === currentMethodology) return
    setPendingMethodology(value)
    setIsConfirmOpen(true)
  }

  async function handleConfirm() {
    if (!pendingMethodology) return
    setIsSaving(true)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodology: pendingMethodology }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update methodology")
      }

      toast.success("Methodology updated — phases have been reorganized")
      setIsConfirmOpen(false)
      setPendingMethodology(null)
      // Full reload needed — router.refresh() doesn't fully revalidate
      // the deeply nested phase/task data in the server component
      window.location.reload()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update methodology"
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setIsConfirmOpen(false)
    setPendingMethodology(null)
  }

  const pendingLabel =
    METHODOLOGIES.find((m) => m.value === pendingMethodology)?.label ??
    pendingMethodology

  return (
    <>
      <Select value={currentMethodology} onValueChange={handleValueChange}>
        <SelectTrigger size="sm" className="h-7 text-xs gap-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {METHODOLOGIES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isConfirmOpen} onOpenChange={handleCancel}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Change Methodology</DialogTitle>
            <DialogDescription>
              Switching to <strong>{pendingLabel}</strong> will replace your
              current phases with new ones. All existing tasks will be moved to
              the first new phase. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? "Updating…" : "Change Methodology"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
