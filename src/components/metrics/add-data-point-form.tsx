"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DataPoint {
  id: string
  value: number
  recordedAt: string
  notes: string | null
  recordedBy: { id: string; name: string; avatarUrl: string | null } | null
}

interface AddDataPointFormProps {
  projectId: string
  metricId: string
  onAdded: (dataPoint: DataPoint) => void
}

export function AddDataPointForm({
  projectId,
  metricId,
  onAdded,
}: AddDataPointFormProps) {
  const [value, setValue] = useState("")
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 16) // datetime-local format
  )
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      toast.error("Value must be a number")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metrics/${metricId}/data-points`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: numValue,
            recordedAt: new Date(date).toISOString(),
            notes: notes || null,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to add data point")
        return
      }

      const dataPoint = await res.json()
      onAdded(dataPoint)
      setValue("")
      setNotes("")
      setDate(new Date().toISOString().slice(0, 16))
      toast.success("Data point added")
    } catch {
      toast.error("Failed to add data point")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-[11px] font-medium text-slate-500">
          Value
        </label>
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.0"
          required
          className="h-8 text-sm"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-[11px] font-medium text-slate-500">
          Date
        </label>
        <Input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="h-8 text-sm"
        />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-[11px] font-medium text-slate-500">
          Notes
        </label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          className="h-8 text-sm"
        />
      </div>
      <Button type="submit" size="sm" disabled={loading} className="h-8 gap-1">
        <Plus className="h-3.5 w-3.5" />
        Add
      </Button>
    </form>
  )
}
