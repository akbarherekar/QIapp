"use client"

import { useState, useCallback } from "react"
import { Plus, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetricCard } from "./metric-card"
import { MetricDetailSheet } from "./metric-detail-sheet"
import { CreateMetricDialog } from "./create-metric-dialog"

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

interface MetricsTabProps {
  projectId: string
  initialMetrics: MetricData[]
  canEdit: boolean
  canAddData: boolean
}

export function MetricsTab({
  projectId,
  initialMetrics,
  canEdit,
  canAddData,
}: MetricsTabProps) {
  const [metrics, setMetrics] = useState<MetricData[]>(initialMetrics)
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const selectedMetric = metrics.find((m) => m.id === selectedMetricId) || null

  const handleMetricCreated = useCallback((metric: MetricData) => {
    setMetrics((prev) => [metric, ...prev])
  }, [])

  const handleMetricUpdated = useCallback((updated: MetricData) => {
    setMetrics((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    )
  }, [])

  const handleMetricDeleted = useCallback((metricId: string) => {
    setMetrics((prev) => prev.filter((m) => m.id !== metricId))
    setSelectedMetricId(null)
  }, [])

  const handleDataPointAdded = useCallback(
    (metricId: string, dataPoint: DataPoint) => {
      setMetrics((prev) =>
        prev.map((m) =>
          m.id === metricId
            ? { ...m, dataPoints: [...m.dataPoints, dataPoint] }
            : m
        )
      )
    },
    []
  )

  const handleDataPointDeleted = useCallback(
    (metricId: string, dataPointId: string) => {
      setMetrics((prev) =>
        prev.map((m) =>
          m.id === metricId
            ? {
                ...m,
                dataPoints: m.dataPoints.filter((dp) => dp.id !== dataPointId),
              }
            : m
        )
      )
    },
    []
  )

  if (metrics.length === 0 && !canEdit) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-medium text-slate-500">
          No metrics yet
        </p>
        <p className="mt-1 text-xs text-slate-400">
          No quality metrics have been set up for this project.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Quality Metrics
        </h3>
        {canEdit && (
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Metric
          </Button>
        )}
      </div>

      {/* Metrics grid */}
      {metrics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-500">
            No metrics yet
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Create your first quality metric to start tracking data.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              onClick={() => setSelectedMetricId(metric.id)}
            />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      {selectedMetric && (
        <MetricDetailSheet
          metric={selectedMetric}
          projectId={projectId}
          open={!!selectedMetricId}
          onOpenChange={(open) => {
            if (!open) setSelectedMetricId(null)
          }}
          canEdit={canEdit}
          canAddData={canAddData}
          onMetricUpdated={handleMetricUpdated}
          onMetricDeleted={handleMetricDeleted}
          onDataPointAdded={handleDataPointAdded}
          onDataPointDeleted={handleDataPointDeleted}
        />
      )}

      {/* Create dialog */}
      <CreateMetricDialog
        projectId={projectId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleMetricCreated}
      />
    </div>
  )
}
