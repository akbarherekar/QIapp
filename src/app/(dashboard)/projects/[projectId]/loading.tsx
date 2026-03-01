import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailLoading() {
  return (
    <div>
      {/* Back link */}
      <div className="mb-6">
        <Skeleton className="mb-3 h-4 w-28" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-96" />

        {/* Metric cards */}
        <div className="mt-4 flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-36 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Skeleton className="mt-6 h-9 w-64 rounded-md" />

      {/* Kanban columns */}
      <div className="mt-4 flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="w-72 shrink-0 rounded-xl border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-4" />
            </div>
            <div className="space-y-2 p-3">
              {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map(
                (_, j) => (
                  <div
                    key={j}
                    className="rounded-lg border-l-[3px] border-l-slate-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <Skeleton className="h-4 w-36" />
                    <div className="mt-1.5 flex items-center gap-2">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
