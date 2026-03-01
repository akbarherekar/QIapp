import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { User, Shield, Bell } from "lucide-react"

export default async function SettingsPage() {
  const user = await requireAuth()

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!fullUser) redirect("/login")

  const roleLabelMap: Record<string, string> = {
    DIRECTOR: "Director",
    PROJECT_LEAD: "Project Lead",
    TEAM_MEMBER: "Team Member",
    VIEWER: "Viewer",
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account and preferences.
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <User className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {fullUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {fullUser.name}
              </p>
              <p className="text-xs text-slate-500">{fullUser.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Department</p>
              <p className="text-sm text-slate-700">
                {fullUser.department || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Member since</p>
              <p className="text-sm text-slate-700">
                {fullUser.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role & Permissions */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Shield className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">
            Role &amp; Permissions
          </h2>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <p className="text-xs text-slate-400">System Role</p>
            <p className="text-sm font-medium text-slate-700">
              {roleLabelMap[fullUser.role] || fullUser.role}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {fullUser.role === "DIRECTOR"
              ? "Full access to all projects and administrative functions."
              : fullUser.role === "PROJECT_LEAD"
                ? "Can create and manage projects, assign tasks, and review inbox actions."
                : fullUser.role === "TEAM_MEMBER"
                  ? "Can view assigned projects and update task statuses."
                  : "Read-only access to assigned projects."}
          </p>
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Bell className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">
            Notifications
          </h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-500">
            Notification preferences coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
