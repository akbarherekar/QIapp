"use client"

import { useState } from "react"
import { Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateGroupDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [department, setDepartment] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          department: department.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create committee")
      }

      toast.success("Committee created successfully")
      setName("")
      setDescription("")
      setDepartment("")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create committee"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Create Committee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Committee</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="group-name" className="text-xs text-slate-500">
              Committee Name
            </Label>
            <Input
              id="group-name"
              placeholder="e.g., Perioperative Quality Committee"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="group-department"
              className="text-xs text-slate-500"
            >
              Department (optional)
            </Label>
            <Input
              id="group-department"
              placeholder="e.g., Quality Improvement"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loading}
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="group-description"
              className="text-xs text-slate-500"
            >
              Description (optional)
            </Label>
            <Textarea
              id="group-description"
              placeholder="Describe the committee's purpose..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="mt-1 min-h-[80px] resize-y"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
