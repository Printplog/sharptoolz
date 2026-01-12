import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsSkeleton() {
    return (
        <div className="space-y-6 w-full p-6">
            <Skeleton className="h-10 w-64 bg-white/10 mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-[400px]">
                        <div className="bg-white/5 border border-white/10 rounded-xl h-full p-6 space-y-4">
                            <div className="flex justify-between">
                                <Skeleton className="h-6 w-32 bg-white/10" />
                                <Skeleton className="h-6 w-6 rounded-full bg-white/10" />
                            </div>
                            <div className="flex-1 flex items-end gap-1 h-[250px] pt-10">
                                {Array.from({ length: 12 }).map((_, j) => (
                                    <Skeleton key={j} className="flex-1 bg-white/5 rounded-t-sm" style={{ height: `${Math.random() * 60 + 20}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                    <Skeleton className="h-6 w-48 bg-white/10" />
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full bg-white/5" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
