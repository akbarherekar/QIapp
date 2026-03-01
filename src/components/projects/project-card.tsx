import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ProjectStatusBadge } from "./project-status-badge"
import { MethodologyBadge } from "./methodology-badge"

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description?: string | null
    status: string
    priority: string
    methodology: string
    department?: string | null
    owner: { name: string; avatarUrl?: string | null }
    members: Array<{ user: { id: string; name: string; avatarUrl?: string | null } }>
    phases: Array<{
      tasks: Array<{ status: string }>
    }>
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function ProjectCard({ project }: ProjectCardProps) {
  const totalTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.length,
    0
  )
  const doneTasks = project.phases.reduce(
    (sum, phase) => sum + phase.tasks.filter((t) => t.status === "DONE").length,
    0
  )
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const priorityColor =
    project.priority === "HIGH"
      ? "bg-red-500"
      : project.priority === "MEDIUM"
        ? "bg-amber-500"
        : "bg-blue-500"

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${priorityColor}`} />
            <ProjectStatusBadge status={project.status} />
          </div>
          <MethodologyBadge methodology={project.methodology} />
        </div>

        <h3 className="mb-1 font-semibold text-slate-900 group-hover:text-primary">
          {project.title}
        </h3>

        {project.department && (
          <p className="mb-3 text-xs text-slate-500">{project.department}</p>
        )}

        {project.description && (
          <p className="mb-3 line-clamp-2 text-sm text-slate-500">
            {project.description}
          </p>
        )}

        {totalTasks > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>{doneTasks}/{totalTasks} tasks</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((m) => (
              <Avatar key={m.user.id} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="bg-slate-100 text-[10px] text-slate-600">
                  {getInitials(m.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 4 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] text-slate-500">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {project.phases.length} phases
          </span>
        </div>
      </div>
    </Link>
  )
}
