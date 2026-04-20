import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function UserActivitySkeleton() {
  return (
    <div className="dashboard-content space-y-8 p-6 pb-24">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <Skeleton className="h-10 w-64 bg-white/10" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-24 bg-white/10 rounded-full" />
          <Skeleton className="h-10 w-48 bg-white/10 rounded-full" />
          <Skeleton className="h-10 w-32 bg-white/10 rounded-full" />
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

      {/* Grid of User Cards Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="h-3 w-32 bg-white/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-6">
                <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-4 w-24 bg-white/10" />
                            <Skeleton className="h-3 w-8 bg-white/10" />
                        </div>
                        <Skeleton className="h-3 w-32 bg-white/10" />
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-lg bg-white/5" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-2 w-16 bg-white/5" />
                            <Skeleton className="h-3 w-full bg-white/10" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-6 h-6 rounded-lg bg-white/5" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-2 w-16 bg-white/5" />
                            <Skeleton className="h-3 w-24 bg-white/10" />
                        </div>
                    </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
