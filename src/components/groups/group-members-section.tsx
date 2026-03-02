"use client"

import { useState } from "react"
import { UserPlus, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
}

interface GroupMembersSectionProps {
  groupId: string
  members: Member[]
  canManage: boolean
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

export function GroupMembersSection({
  groupId,
  members,
  canManage,
}: GroupMembersSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("MEMBER")
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  async function searchUsers() {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const allUsers = await res.json()
      const memberIds = new Set(members.map((m) => m.user.id))
      const filtered = allUsers.filter(
        (u: { id: string; name: string; email: string }) =>
          !memberIds.has(u.id) &&
          (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setUsers(filtered)
    } catch {
      // ignore
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleAdd() {
    if (!selectedUserId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add member")
      }
      toast.success("Member added")
      setOpen(false)
      setSelectedUserId("")
      setSearchQuery("")
      setUsers([])
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(memberId: string) {
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("Member removed")
      router.refresh()
    } catch {
      toast.error("Failed to remove member")
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">
          Members ({members.length})
        </h3>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <UserPlus className="h-3 w-3" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={searchUsers}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {users.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          selectedUserId === u.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <span className="font-medium">{u.name}</span>
                        <span className="text-xs text-slate-400">
                          {u.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHAIR">Chair</SelectItem>
                    <SelectItem value="SECRETARY">Secretary</SelectItem>
                    <SelectItem value="MEMBER">Member</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleAdd}
                  disabled={!selectedUserId || loading}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-slate-100 text-[10px] text-slate-600">
                {getInitials(m.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">
                {m.user.name}
              </p>
              <p className="text-xs text-slate-400">{m.user.email}</p>
            </div>
            <Badge
              className={`h-5 border-0 px-1.5 text-[10px] font-medium ${roleColors[m.role] || roleColors.MEMBER}`}
            >
              {m.role}
            </Badge>
            {canManage && m.role !== "CHAIR" && (
              <button
                onClick={() => handleRemove(m.id)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
