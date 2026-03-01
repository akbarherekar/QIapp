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

interface SPCChartProps {
  dataPoints: Array<{ value: number; recordedAt: string }>
  target: number | null
  lowerBound: number | null
  upperBound: number | null
  unit: string | null
}

export function SPCChart({
  dataPoints,
  target,
  lowerBound,
  upperBound,
  unit,
}: SPCChartProps) {
  const { chartData, mean, ucl, lcl } = useMemo(() => {
    const sorted = [...dataPoints].sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )

    const values = sorted.map((dp) => dp.value)
    const mean = values.reduce((a, b) => a + b, 0) / (values.length || 1)
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
      (values.length || 1)
    const stdDev = Math.sqrt(variance)

    const ucl = upperBound ?? mean + 3 * stdDev
    const lcl = lowerBound ?? mean - 3 * stdDev

    const chartData = sorted.map((dp) => ({
      date: dp.recordedAt,
      value: dp.value,
      label: format(new Date(dp.recordedAt), "MMM d"),
      outOfControl: dp.value > ucl || dp.value < lcl,
    }))

    return { chartData, mean, ucl, lcl }
  }, [dataPoints, lowerBound, upperBound])

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
          domain={[
            Math.min(lcl, ...chartData.map((d) => d.value)) - 1,
            Math.max(ucl, ...chartData.map((d) => d.value)) + 1,
          ]}
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
        {/* Control limits */}
        <ReferenceLine
          y={ucl}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{
            value: `UCL: ${ucl.toFixed(1)}`,
            position: "insideTopRight",
            style: { fontSize: 10, fill: "#ef4444" },
          }}
        />
        <ReferenceLine
          y={lcl}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{
            value: `LCL: ${lcl.toFixed(1)}`,
            position: "insideBottomRight",
            style: { fontSize: 10, fill: "#ef4444" },
          }}
        />
        <ReferenceLine
          y={mean}
          stroke="#64748b"
          label={{
            value: `CL: ${mean.toFixed(1)}`,
            position: "insideBottomRight",
            style: { fontSize: 10, fill: "#64748b" },
          }}
        />
        {target !== null && (
          <ReferenceLine
            y={target}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            label={{
              value: `Target: ${target}`,
              position: "insideTopLeft",
              style: { fontSize: 10, fill: "#f59e0b" },
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#266d50"
          strokeWidth={2}
          dot={(props: Record<string, unknown>) => {
            const { cx, cy, payload } = props as {
              cx: number
              cy: number
              payload: { outOfControl: boolean }
            }
            const isOOC = payload?.outOfControl
            return (
              <circle
                key={`dot-${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r={isOOC ? 6 : 4}
                fill={isOOC ? "#ef4444" : "#266d50"}
                stroke={isOOC ? "#ef4444" : "#266d50"}
                strokeWidth={isOOC ? 2 : 0}
              />
            )
          }}
          activeDot={{ r: 6, fill: "#266d50" }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
