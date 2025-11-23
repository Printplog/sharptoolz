import { Skeleton } from "@/components/ui/skeleton";

export default function SvgFormTranslatorSkeleton() {
  return (
    <div>
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-10 w-24 bg-white/5 border border-white/10 animate-pulse" />
        <Skeleton className="h-10 w-24 bg-white/5 border border-white/10 animate-pulse" />
      </div>
      
      {/* Form panel skeleton - matches FormPanel structure exactly */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32 bg-white/5 border border-white/10 animate-pulse" />
          <Skeleton className="h-9 w-20 bg-white/5 border border-white/10 animate-pulse" />
        </div>

        {/* Form fields skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24 bg-white/5 border border-white/10 animate-pulse" />
              <Skeleton className="h-10 w-full bg-white/5 border border-white/10 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Buttons section skeleton */}
        <div className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-5">
          <Skeleton className="h-12 w-full lg:w-40 bg-white/5 border border-white/10 animate-pulse" />
          <Skeleton className="h-12 w-full lg:w-40 bg-white/5 border border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

