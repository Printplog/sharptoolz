import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolCardSkeleton() {
    return (
        <Card className="relative h-[420px] rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-3xl p-8 flex flex-col animate-pulse">
            {/* Top Badges Area */}
            <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
                <Skeleton className="w-10 h-10 bg-white/10 rounded-2xl" />
                <Skeleton className="h-4 w-24 bg-white/5 rounded-full" />
            </div>

            {/* Banner Background Placeholder */}
            <div className="absolute inset-0 z-0">
                <Skeleton className="w-full h-full bg-white/[0.02]" />
            </div>

            {/* Bottom Content Area */}
            <div className="mt-auto relative z-20 space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24 bg-white/5 rounded-full" />
                    <Skeleton className="h-8 w-full bg-white/10 rounded-lg" />
                    <Skeleton className="h-8 w-2/3 bg-white/10 rounded-lg" />
                </div>

                {/* Bottom Action Area */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <Skeleton className="h-11 flex-1 bg-white/10 rounded-full" />
                  <Skeleton className="h-11 w-11 bg-white/5 rounded-full shrink-0" />
                </div>            </div>
        </Card>
    );
}
