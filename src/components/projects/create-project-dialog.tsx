"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CreateProjectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    methodology: "PDSA",
    priority: "MEDIUM",
    department: "",
    unit: "",
    targetMetric: "",
    baselineValue: "",
    goalValue: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to create project")
        return
      }

      const project = await res.json()
      toast.success("Project created")
      setOpen(false)
      setForm({
        title: "",
        description: "",
        methodology: "PDSA",
        priority: "MEDIUM",
        department: "",
        unit: "",
        targetMetric: "",
        baselineValue: "",
        goalValue: "",
      })
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create QI Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project title</Label>
            <Input
              id="title"
              placeholder="e.g. Reduce CAUTI in ICU"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the quality improvement initiative..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Methodology</Label>
              <Select
                value={form.methodology}
                onValueChange={(v) => updateField("methodology", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDSA">PDSA</SelectItem>
                  <SelectItem value="DMAIC">DMAIC</SelectItem>
                  <SelectItem value="LEAN">Lean</SelectItem>
                  <SelectItem value="SIX_SIGMA">Six Sigma</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => updateField("priority", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g. ICU"
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="e.g. 4 North"
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetMetric">Target metric</Label>
            <Input
              id="targetMetric"
              placeholder="e.g. CAUTI rate per 1,000 catheter days"
              value={form.targetMetric}
              onChange={(e) => updateField("targetMetric", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baselineValue">Baseline</Label>
              <Input
                id="baselineValue"
                placeholder="e.g. 3.2"
                value={form.baselineValue}
                onChange={(e) => updateField("baselineValue", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalValue">Goal</Label>
              <Input
                id="goalValue"
                placeholder="e.g. 1.5"
                value={form.goalValue}
                onChange={(e) => updateField("goalValue", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
