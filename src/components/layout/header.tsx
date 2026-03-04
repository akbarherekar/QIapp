"use client"

import { Bell, Search } from "lucide-react"
import { UserNav } from "./user-nav"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-64 justify-start gap-2 text-sm text-slate-400"
          onClick={() => {
            // TODO: Command palette
          }}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400">Created by SurgeryReady LLC</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
          <Bell className="h-4 w-4" />
        </Button>
        <UserNav />
      </div>
    </header>
  )
}
