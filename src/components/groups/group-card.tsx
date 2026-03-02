import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface GroupCardProps {
  group: {
    id: string
    name: string
    description?: string | null
    status: string
    department?: string | null
    members: Array<{
      role: string
      user: { id: string; name: string; avatarUrl: string | null }
    }>
    _count: { projects: number; meetingNotes: number }
  }
  userRole?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const roleColors: Record<string, string> = {
  CHAIR: "bg-amber-100 text-amber-700",
  SECRETARY: "bg-blue-100 text-blue-700",
  MEMBER: "bg-slate-100 text-slate-600",
}

export function GroupCard({ group, userRole }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
            {group.name.charAt(0).toUpperCase()}
          </div>
          {userRole && (
            <Badge
              className={`h-5 border-0 px-1.5 text-[10px] font-medium ${roleColors[userRole] || roleColors.MEMBER}`}
            >
              {userRole}
            </Badge>
          )}
        </div>

        <h3 className="mb-1 font-semibold text-slate-900 group-hover:text-primary">
          {group.name}
        </h3>

        {group.department && (
          <p className="mb-2 text-xs text-slate-500">{group.department}</p>
        )}

        {group.description && (
          <p className="mb-3 line-clamp-2 text-sm text-slate-500">
            {group.description}
          </p>
        )}

        <div className="mb-3 flex gap-3 text-xs text-slate-500">
          <span>{group._count.projects} projects</span>
          <span>{group.members.length} members</span>
          <span>{group._count.meetingNotes} meetings</span>
        </div>

        <div className="flex -space-x-2">
          {group.members.slice(0, 5).map((m) => (
            <Avatar
              key={m.user.id}
              className="h-6 w-6 border-2 border-white"
            >
              <AvatarFallback className="bg-slate-100 text-[10px] text-slate-600">
                {getInitials(m.user.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {group.members.length > 5 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] text-slate-500">
              +{group.members.length - 5}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
