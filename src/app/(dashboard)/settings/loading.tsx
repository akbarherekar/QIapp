import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>

      {/* Profile card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1 h-3 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-4 w-28" />
            </div>
          </div>
        </div>
      </div>

      {/* Role card */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>

      {/* Notifications card */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-5">
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    </div>
  )
}
