import { requireAuth, hasMinSystemRole } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { ProjectCard } from "@/components/projects/project-card"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { FolderKanban } from "lucide-react"

export default async function ProjectsPage() {
  const user = await requireAuth()

  const isDirector = user.role === "DIRECTOR"

  const projects = await db.project.findMany({
    where: isDirector
      ? {}
      : {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      phases: {
        orderBy: { orderIndex: "asc" },
        include: {
          tasks: { select: { status: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const canCreate = hasMinSystemRole(user.role, "PROJECT_LEAD")

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your quality improvement initiatives
          </p>
        </div>
        {canCreate && <CreateProjectDialog />}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12">
          <FolderKanban className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="mb-1 text-sm font-medium text-slate-900">
            No projects yet
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            Create your first QI project to get started.
          </p>
          {canCreate && <CreateProjectDialog />}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
