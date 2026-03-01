"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }

      router.push("/login")
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          QI
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Join your QI team to start improving care
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Dr. Jane Smith"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@hospital.org"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            placeholder="e.g. ICU, Emergency, Surgery"
            value={form.department}
            onChange={(e) => updateField("department", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
