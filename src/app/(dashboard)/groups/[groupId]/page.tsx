import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ArrowLeft, FolderKanban, NotebookText } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectCard } from "@/components/projects/project-card"
import { GroupMembersSection } from "@/components/groups/group-members-section"
import { AddGroupProjectDialog } from "@/components/groups/add-group-project-dialog"
import { GroupMeetingsTab } from "@/components/groups/group-meetings-tab"
import { GROUP_ROLE_LEVEL } from "@/lib/constants"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { groupId } = await params
  const isDirector = session.user.role === "DIRECTOR"

  // Check access
  if (!isDirector) {
    const membership = await db.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: session.user.id },
      },
    })
    if (!membership) notFound()
  }

  const [group, meetingNotes, pendingCount] = await Promise.all([
    db.projectGroup.findUnique({
      where: { id: groupId },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                role: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        projects: {
          include: {
            project: {
              include: {
                owner: { select: { id: true, name: true, avatarUrl: true } },
                members: {
                  include: {
                    user: { select: { id: true, name: true, avatarUrl: true } },
                  },
                },
                phases: {
                  orderBy: { orderIndex: "asc" },
                  include: { tasks: { select: { status: true } } },
                },
              },
            },
          },
        },
      },
    }),
    db.meetingNote.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
        actions: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.meetingNote.count({
      where: { groupId, status: "REVIEWED" },
    }),
  ])

  if (!group) notFound()

  const userMembership = group.members.find(
    (m) => m.user.id === session.user.id
  )
  const userGroupRole = isDirector ? "CHAIR" : userMembership?.role || "MEMBER"
  const canManage =
    GROUP_ROLE_LEVEL[userGroupRole as keyof typeof GROUP_ROLE_LEVEL] >=
    GROUP_ROLE_LEVEL.SECRETARY

  const projects = group.projects.map((pl) => pl.project)
  const existingProjectIds = projects.map((p) => p.id)

  // Build project id → title map for meeting action display
  const projectMap: Record<string, string> = {}
  for (const p of projects) {
    projectMap[p.id] = p.title
  }

  // Serialize dates for client components
  const serializedMeetingNotes = JSON.parse(JSON.stringify(meetingNotes))

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/groups"
          className="mb-3 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
        >
          <ArrowLeft className="h-3 w-3" />
          Committees
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-900">
                {group.name}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs ${group.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}
              >
                {group.status}
              </Badge>
            </div>
            {group.department && (
              <p className="mt-1 text-sm text-slate-500">{group.department}</p>
            )}
            {group.description && (
              <p className="mt-1 text-sm text-slate-600">
                {group.description}
              </p>
            )}
          </div>

          <div className="flex -space-x-2">
            {group.members.slice(0, 5).map((m) => (
              <Avatar
                key={m.user.id}
                className="h-8 w-8 border-2 border-white"
              >
                <AvatarFallback className="bg-slate-100 text-xs text-slate-600">
                  {getInitials(m.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs text-slate-500">
                +{group.members.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-1.5">
            <FolderKanban className="h-3.5 w-3.5" />
            Projects
            <span className="ml-1 text-xs text-slate-400">
              {projects.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="gap-1.5">
            <NotebookText className="h-3.5 w-3.5" />
            Meetings
            {pendingCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">
              Linked Projects
            </h2>
            {canManage && (
              <AddGroupProjectDialog
                groupId={groupId}
                existingProjectIds={existingProjectIds}
              />
            )}
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <FolderKanban className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-500">
                No projects linked
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Add projects to this committee to enable group-level meetings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Members section below projects */}
          <div className="mt-8">
            <GroupMembersSection
              groupId={groupId}
              members={group.members.map((m) => ({
                id: m.id,
                role: m.role,
                user: {
                  id: m.user.id,
                  name: m.user.name,
                  email: m.user.email,
                  avatarUrl: m.user.avatarUrl,
                },
              }))}
              canManage={canManage}
            />
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="mt-4">
          <GroupMeetingsTab
            groupId={groupId}
            initialMeetingNotes={serializedMeetingNotes}
            projectMap={projectMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
