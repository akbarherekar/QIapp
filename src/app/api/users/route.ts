import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      avatarUrl: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users)
}
