"use client"

import { useState } from "react"
import { Settings, Mail, Zap, Hash } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface InboxSettingsProps {
  projectId: string
  inboxEnabled: boolean
  inboxAutoApply: boolean
  inboxShortcode: string | null
}

export function InboxSettings({
  projectId,
  inboxEnabled: initialEnabled,
  inboxAutoApply: initialAutoApply,
  inboxShortcode,
}: InboxSettingsProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [autoApply, setAutoApply] = useState(initialAutoApply)
  const [loading, setLoading] = useState<string | null>(null)

  async function toggleSetting(
    field: "inboxEnabled" | "inboxAutoApply",
    value: boolean
  ) {
    setLoading(field)
    const prev = field === "inboxEnabled" ? enabled : autoApply

    // Optimistic update
    if (field === "inboxEnabled") setEnabled(value)
    else setAutoApply(value)

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
      toast.success("Setting updated")
    } catch {
      // Rollback
      if (field === "inboxEnabled") setEnabled(prev)
      else setAutoApply(prev)
      toast.error("Failed to update setting")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <Settings className="h-3.5 w-3.5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900">
          Inbox Settings
        </h3>
      </div>

      <div className="divide-y divide-slate-100">
        {/* Inbox Enabled */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Inbox enabled
              </p>
              <p className="text-xs text-slate-400">
                Accept and process incoming messages
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            onClick={() => toggleSetting("inboxEnabled", !enabled)}
            disabled={loading !== null}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              enabled ? "bg-primary" : "bg-slate-200",
              loading === "inboxEnabled" && "opacity-50"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                enabled && "translate-x-4"
              )}
            />
          </button>
        </div>

        {/* Auto-apply */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
              <Zap className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Auto-apply actions
              </p>
              <p className="text-xs text-slate-400">
                Automatically apply AI-extracted actions without review
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={autoApply}
            onClick={() => toggleSetting("inboxAutoApply", !autoApply)}
            disabled={loading !== null || !enabled}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              autoApply && enabled ? "bg-primary" : "bg-slate-200",
              (loading === "inboxAutoApply" || !enabled) && "opacity-50"
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                autoApply && enabled && "translate-x-4"
              )}
            />
          </button>
        </div>

        {/* Shortcode */}
        {inboxShortcode && (
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100">
                <Hash className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Project shortcode
                </p>
                <p className="text-xs text-slate-400">
                  Use in email subject lines to route messages
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-mono text-xs">
              {inboxShortcode}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}
