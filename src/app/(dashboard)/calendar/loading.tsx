import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>

      <div className="flex gap-6">
        {/* Calendar grid */}
        <div className="flex-1">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-1">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-slate-100">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="px-2 py-2 text-center">
                  <Skeleton className="mx-auto h-3 w-6" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[80px] border-b border-r border-slate-100 p-1.5"
                >
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 shrink-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
