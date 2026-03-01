import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  department: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = registerSchema.parse(body)

    const existing = await db.user.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        hashedPassword,
        department: data.department,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
