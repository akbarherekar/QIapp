import { cn } from "@/lib/utils"

const statusConfig = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600" },
  PUBLISHED: { label: "Published", className: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-500" },
} as const

export function SurveyStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: "bg-slate-100 text-slate-600",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
