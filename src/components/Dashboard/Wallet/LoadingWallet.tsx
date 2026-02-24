import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingWallet() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-44 rounded-xl bg-white/5" />
        <Skeleton className="h-11 w-32 rounded-2xl bg-white/5" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Balance Card */}
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-green-500/10 bg-green-500/5 p-8 space-y-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-2xl bg-green-500/20" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 rounded-full bg-white/5" />
                <Skeleton className="h-14 w-44 rounded-xl bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-14 w-40 rounded-2xl bg-white/10" />
          </div>
        </div>

        {/* Right: Transaction History Card */}
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl bg-white/5" />
            <Skeleton className="h-5 w-24 rounded-full bg-white/5" />
          </div>
          <div className="p-8 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded-full bg-white/5" />
                    <Skeleton className="h-2.5 w-20 rounded-full bg-white/[0.03]" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-full bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
