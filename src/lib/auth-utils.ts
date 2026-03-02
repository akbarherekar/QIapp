import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { SYSTEM_ROLE_LEVEL, PROJECT_ROLE_LEVEL, GROUP_ROLE_LEVEL } from "@/lib/constants"
import type { SystemRole, ProjectMemberRole, GroupMemberRole } from "@/generated/prisma/enums"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user) return null
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireRole(...roles: SystemRole[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new Error("Insufficient permissions")
  }
  return user
}

export async function requireProjectAccess(
  projectId: string,
  minProjectRole?: ProjectMemberRole
) {
  const user = await requireAuth()

  if (user.role === "DIRECTOR") return user

  const membership = await db.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: user.id },
    },
  })

  if (!membership) {
    throw new Error("Not a member of this project")
  }

  if (minProjectRole) {
    const requiredLevel = PROJECT_ROLE_LEVEL[minProjectRole]
    const userLevel = PROJECT_ROLE_LEVEL[membership.role]
    if (userLevel < requiredLevel) {
      throw new Error("Insufficient project permissions")
    }
  }

  return { ...user, projectRole: membership.role }
}

export function hasMinSystemRole(
  userRole: SystemRole,
  minRole: SystemRole
): boolean {
  return SYSTEM_ROLE_LEVEL[userRole] >= SYSTEM_ROLE_LEVEL[minRole]
}

export async function requireGroupAccess(
  groupId: string,
  minGroupRole?: GroupMemberRole
) {
  const user = await requireAuth()

  if (user.role === "DIRECTOR") return { ...user, groupRole: "CHAIR" as GroupMemberRole }

  const membership = await db.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId: user.id },
    },
  })

  if (!membership) {
    throw new Error("Not a member of this group")
  }

  if (minGroupRole) {
    const requiredLevel = GROUP_ROLE_LEVEL[minGroupRole]
    const userLevel = GROUP_ROLE_LEVEL[membership.role]
    if (userLevel < requiredLevel) {
      throw new Error("Insufficient group permissions")
    }
  }

  return { ...user, groupRole: membership.role }
}
