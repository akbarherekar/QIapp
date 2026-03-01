"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface MetricData {
  id: string
  name: string
  unit: string | null
  lowerBound: number | null
  upperBound: number | null
  target: number | null
  createdAt: string
  dataPoints: Array<{
    id: string
    value: number
    recordedAt: string
    notes: string | null
    recordedBy: { id: string; name: string; avatarUrl: string | null } | null
  }>
}

interface CreateMetricDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (metric: MetricData) => void
}

export function CreateMetricDialog({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: CreateMetricDialogProps) {
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("")
  const [target, setTarget] = useState("")
  const [lowerBound, setLowerBound] = useState("")
  const [upperBound, setUpperBound] = useState("")
  const [loading, setLoading] = useState(false)

  function reset() {
    setName("")
    setUnit("")
    setTarget("")
    setLowerBound("")
    setUpperBound("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit: unit || null,
          target: target ? parseFloat(target) : null,
          lowerBound: lowerBound ? parseFloat(lowerBound) : null,
          upperBound: upperBound ? parseFloat(upperBound) : null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to create metric")
        return
      }

      const metric = await res.json()
      onCreated({ ...metric, dataPoints: metric.dataPoints || [] })
      onOpenChange(false)
      reset()
      toast.success(`Metric "${metric.name}" created`)
    } catch {
      toast.error("Failed to create metric")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Metric</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="metric-name">Name</Label>
            <Input
              id="metric-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., CAUTI Rate"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="metric-unit">Unit</Label>
            <Input
              id="metric-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., per 1,000 catheter days"
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="metric-target">Target</Label>
              <Input
                id="metric-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="metric-lcl">Lower Limit</Label>
              <Input
                id="metric-lcl"
                type="number"
                step="any"
                value={lowerBound}
                onChange={(e) => setLowerBound(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="metric-ucl">Upper Limit</Label>
              <Input
                id="metric-ucl"
                type="number"
                step="any"
                value={upperBound}
                onChange={(e) => setUpperBound(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Metric"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
