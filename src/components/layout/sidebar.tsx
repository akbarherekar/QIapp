"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  Activity,
  Settings,
  HelpCircle,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  groups?: Array<{ id: string; name: string }>
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/groups", label: "Committees", icon: Users },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/activity", label: "Activity", icon: Activity },
]

const bottomItems = [
  { href: "/tutorial", label: "Tutorial", icon: HelpCircle },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar({ groups = [] }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [committeesOpen, setCommitteesOpen] = useState(true)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              QI
            </div>
            <span className="text-sm font-semibold text-slate-900">
              QI Tracker
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}

        {/* Collapsible committees section */}
        {groups.length > 0 && !collapsed && (
          <div className="pt-2">
            <button
              onClick={() => setCommitteesOpen(!committeesOpen)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400 hover:text-slate-600"
            >
              <span>My Committees</span>
              {committeesOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {committeesOpen && (
              <div className="mt-0.5 space-y-0.5">
                {groups.map((group) => {
                  const isActive = pathname.startsWith(`/groups/${group.id}`)
                  return (
                    <Link
                      key={group.id}
                      href={`/groups/${group.id}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 text-[10px] font-semibold text-slate-500">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{group.name}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 px-2 py-3">
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
