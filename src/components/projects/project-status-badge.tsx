import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  PLANNING: { label: "Planning", className: "bg-slate-100 text-slate-700 border-slate-200" },
  ACTIVE: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ON_HOLD: { label: "On Hold", className: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Completed", className: "bg-blue-50 text-blue-700 border-blue-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
}

export function ProjectStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PLANNING
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
