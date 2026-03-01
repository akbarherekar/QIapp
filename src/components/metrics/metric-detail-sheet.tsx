"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { format } from "date-fns"
import { Trash2, Edit, BarChart3, LineChart } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AddDataPointForm } from "./add-data-point-form"

const RunChart = dynamic(
  () => import("./run-chart").then((m) => ({ default: m.RunChart })),
  { ssr: false, loading: () => <div className="h-[300px]" /> }
)
const SPCChart = dynamic(
  () => import("./spc-chart").then((m) => ({ default: m.SPCChart })),
  { ssr: false, loading: () => <div className="h-[300px]" /> }
)

interface DataPoint {
  id: string
  value: number
  recordedAt: string
  notes: string | null
  recordedBy: { id: string; name: string; avatarUrl: string | null } | null
}

interface MetricData {
  id: string
  name: string
  unit: string | null
  lowerBound: number | null
  upperBound: number | null
  target: number | null
  createdAt: string
  dataPoints: DataPoint[]
}

interface MetricDetailSheetProps {
  metric: MetricData
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  canEdit: boolean
  canAddData: boolean
  onMetricUpdated: (metric: MetricData) => void
  onMetricDeleted: (metricId: string) => void
  onDataPointAdded: (metricId: string, dataPoint: DataPoint) => void
  onDataPointDeleted: (metricId: string, dataPointId: string) => void
}

export function MetricDetailSheet({
  metric,
  projectId,
  open,
  onOpenChange,
  canEdit,
  canAddData,
  onMetricUpdated,
  onMetricDeleted,
  onDataPointAdded,
  onDataPointDeleted,
}: MetricDetailSheetProps) {
  const [chartType, setChartType] = useState<"run" | "spc">("run")
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(metric.name)
  const [editUnit, setEditUnit] = useState(metric.unit || "")
  const [editTarget, setEditTarget] = useState(
    metric.target?.toString() || ""
  )
  const [editLower, setEditLower] = useState(
    metric.lowerBound?.toString() || ""
  )
  const [editUpper, setEditUpper] = useState(
    metric.upperBound?.toString() || ""
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Sort data points ascending for charts
  const sortedDataPoints = [...metric.dataPoints].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )

  const handleAddDataPoint = useCallback(
    (dataPoint: DataPoint) => {
      onDataPointAdded(metric.id, dataPoint)
    },
    [metric.id, onDataPointAdded]
  )

  async function handleSaveEdit() {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metrics/${metric.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editName,
            unit: editUnit || null,
            target: editTarget ? parseFloat(editTarget) : null,
            lowerBound: editLower ? parseFloat(editLower) : null,
            upperBound: editUpper ? parseFloat(editUpper) : null,
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to update metric")
        return
      }
      const updated = await res.json()
      onMetricUpdated({
        ...metric,
        name: updated.name,
        unit: updated.unit,
        target: updated.target,
        lowerBound: updated.lowerBound,
        upperBound: updated.upperBound,
      })
      setEditing(false)
      toast.success("Metric updated")
    } catch {
      toast.error("Failed to update metric")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metrics/${metric.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        toast.error("Failed to delete metric")
        return
      }
      onMetricDeleted(metric.id)
      onOpenChange(false)
      toast.success("Metric deleted")
    } catch {
      toast.error("Failed to delete metric")
    } finally {
      setDeleting(false)
    }
  }

  async function handleDeleteDataPoint(dataPointId: string) {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/metrics/${metric.id}/data-points/${dataPointId}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        toast.error("Failed to delete data point")
        return
      }
      onDataPointDeleted(metric.id, dataPointId)
      toast.success("Data point deleted")
    } catch {
      toast.error("Failed to delete data point")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>{metric.name}</SheetTitle>
              {metric.unit && (
                <p className="mt-0.5 text-sm text-slate-500">{metric.unit}</p>
              )}
            </div>
            {canEdit && !editing && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditName(metric.name)
                    setEditUnit(metric.unit || "")
                    setEditTarget(metric.target?.toString() || "")
                    setEditLower(metric.lowerBound?.toString() || "")
                    setEditUpper(metric.upperBound?.toString() || "")
                    setEditing(true)
                  }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Edit form */}
        {editing && (
          <div className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Unit</Label>
              <Input
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Target</Label>
                <Input
                  type="number"
                  step="any"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">LCL</Label>
                <Input
                  type="number"
                  step="any"
                  value={editLower}
                  onChange={(e) => setEditLower(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">UCL</Label>
                <Input
                  type="number"
                  step="any"
                  value={editUpper}
                  onChange={(e) => setEditUpper(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}

        {/* Chart toggle */}
        <div className="mt-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            onClick={() => setChartType("run")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              chartType === "run"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <LineChart className="h-3.5 w-3.5" />
            Run Chart
          </button>
          <button
            onClick={() => setChartType("spc")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              chartType === "spc"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            SPC Chart
          </button>
        </div>

        {/* Chart */}
        <div className="mt-4">
          {chartType === "run" ? (
            <RunChart
              dataPoints={sortedDataPoints}
              target={metric.target}
              unit={metric.unit}
            />
          ) : (
            <SPCChart
              dataPoints={sortedDataPoints}
              target={metric.target}
              lowerBound={metric.lowerBound}
              upperBound={metric.upperBound}
              unit={metric.unit}
            />
          )}
        </div>

        {/* Metric info badges */}
        <div className="mt-3 flex flex-wrap gap-2">
          {metric.target !== null && (
            <Badge variant="secondary" className="text-xs">
              Target: {metric.target}
            </Badge>
          )}
          {metric.lowerBound !== null && (
            <Badge variant="secondary" className="text-xs">
              LCL: {metric.lowerBound}
            </Badge>
          )}
          {metric.upperBound !== null && (
            <Badge variant="secondary" className="text-xs">
              UCL: {metric.upperBound}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {metric.dataPoints.length} data point
            {metric.dataPoints.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Add data point form */}
        {canAddData && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">
              Add Data Point
            </p>
            <AddDataPointForm
              projectId={projectId}
              metricId={metric.id}
              onAdded={handleAddDataPoint}
            />
          </div>
        )}

        {/* Data table */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Data Points
          </p>
          {sortedDataPoints.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              No data points recorded yet
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Value</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                    {canEdit && (
                      <th className="w-8 px-3 py-2 font-medium" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...sortedDataPoints].reverse().map((dp) => (
                    <tr
                      key={dp.id}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-3 py-1.5 text-slate-600">
                        {format(new Date(dp.recordedAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-3 py-1.5 font-medium text-slate-900">
                        {dp.value}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-1.5 text-slate-500">
                        {dp.notes || "—"}
                      </td>
                      {canEdit && (
                        <td className="px-2 py-1.5">
                          <button
                            onClick={() => handleDeleteDataPoint(dp.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
