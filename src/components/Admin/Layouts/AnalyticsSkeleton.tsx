import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsSkeleton() {
  return (
    <div className="dashboard-content space-y-8 w-full p-6">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Skeleton className="h-10 w-64 bg-white/10" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-white/10 rounded-full" />
          <Skeleton className="h-10 w-48 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-start">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-10 w-10 bg-white/10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20 bg-white/10" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[400px] bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-32 bg-white/10" />
              <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 flex items-end gap-1 h-[250px] pt-10">
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton 
                    key={j} 
                    className="flex-1 bg-white/5 rounded-t-sm" 
                    style={{ height: `${Math.random() * 60 + 20}%` }} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table/List Skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <Skeleton className="h-6 w-48 bg-white/10" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
