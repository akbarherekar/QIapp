import { Badge } from "@/components/ui/badge"

export function MethodologyBadge({ methodology }: { methodology: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {methodology.replace(/_/g, " ")}
    </Badge>
  )
}
