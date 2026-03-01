"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface MetricCardProps {
  metric: MetricData
  onClick: () => void
}

export function MetricCard({ metric, onClick }: MetricCardProps) {
  const { latestValue, trend, sparklinePath } = useMemo(() => {
    const sorted = [...metric.dataPoints].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )

    const latestValue = sorted.length > 0 ? sorted[sorted.length - 1].value : null

    // Trend: compare last 2 points
    let trend: "up" | "down" | "flat" = "flat"
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2].value
      const curr = sorted[sorted.length - 1].value
      if (curr > prev) trend = "up"
      else if (curr < prev) trend = "down"
    }

    // Sparkline from last 10 points
    const sparkPoints = sorted.slice(-10)
    let sparklinePath = ""
    if (sparkPoints.length >= 2) {
      const values = sparkPoints.map((dp) => dp.value)
      const min = Math.min(...values)
      const max = Math.max(...values)
      const range = max - min || 1
      const width = 80
      const height = 24
      const points = values.map((v, i) => ({
        x: (i / (values.length - 1)) * width,
        y: height - ((v - min) / range) * height,
      }))
      sparklinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    }

    return { latestValue, trend, sparklinePath }
  }, [metric.dataPoints])

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm",
        "transition-colors hover:border-slate-300 hover:shadow"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {metric.name}
          </p>
          {metric.unit && (
            <p className="mt-0.5 truncate text-xs text-slate-400">
              {metric.unit}
            </p>
          )}
        </div>
        {sparklinePath && (
          <svg
            width="80"
            height="24"
            viewBox="0 0 80 24"
            className="ml-2 shrink-0"
          >
            <path
              d={sparklinePath}
              fill="none"
              stroke="#266d50"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        {latestValue !== null ? (
          <span className="text-2xl font-semibold text-slate-900">
            {latestValue % 1 === 0
              ? latestValue
              : latestValue.toFixed(1)}
          </span>
        ) : (
          <span className="text-lg text-slate-400">No data</span>
        )}

        {latestValue !== null && (
          <div className="mb-0.5 flex items-center gap-0.5">
            {trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : (
              <Minus className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>
        )}
      </div>

      {metric.target !== null && (
        <p className="mt-1 text-xs text-slate-400">
          Target: {metric.target}
          {metric.unit ? ` ${metric.unit}` : ""}
        </p>
      )}
    </button>
  )
}
