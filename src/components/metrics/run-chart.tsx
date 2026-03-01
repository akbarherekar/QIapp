"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"

interface RunChartProps {
  dataPoints: Array<{ value: number; recordedAt: string }>
  target: number | null
  unit: string | null
}

export function RunChart({ dataPoints, target, unit }: RunChartProps) {
  const { chartData, median } = useMemo(() => {
    const sorted = [...dataPoints].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    const chartData = sorted.map((dp) => ({
      date: dp.recordedAt,
      value: dp.value,
      label: format(new Date(dp.recordedAt), "MMM d"),
    }))

    const values = sorted.map((dp) => dp.value)
    const sortedValues = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sortedValues.length / 2)
    const median =
      sortedValues.length % 2 === 0
        ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
        : sortedValues[mid]

    return { chartData, median }
  }, [dataPoints])

  if (dataPoints.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
        No data points yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          label={
            unit
              ? {
                  value: unit,
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11, fill: "#94a3b8" },
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          formatter={(value) => [
            `${value}${unit ? ` ${unit}` : ""}`,
            "Value",
          ]}
          labelFormatter={(label) => String(label)}
        />
        <ReferenceLine
          y={median}
          stroke="#94a3b8"
          strokeDasharray="5 5"
          label={{
            value: `Median: ${median.toFixed(1)}`,
            position: "insideBottomRight",
            style: { fontSize: 10, fill: "#94a3b8" },
          }}
        />
        {target !== null && (
          <ReferenceLine
            y={target}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{
              value: `Target: ${target}`,
              position: "insideTopRight",
              style: { fontSize: 10, fill: "#f59e0b" },
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#266d50"
          strokeWidth={2}
          dot={{ fill: "#266d50", r: 4 }}
          activeDot={{ r: 6, fill: "#266d50" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
