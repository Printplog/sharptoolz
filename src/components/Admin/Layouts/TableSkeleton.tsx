import { Skeleton } from "@/components/ui/skeleton";

export default function TableSkeleton() {
    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-72 bg-white/5" />
                </div>
                <Skeleton className="h-10 w-32 bg-white/10" />
            </div>

            <div className="border border-white/10 rounded-lg overflow-hidden">
                <div className="bg-white/5 border-b border-white/10 h-12 flex items-center px-4 gap-4">
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/4 bg-white/10" />
                </div>
                <div className="divide-y divide-white/5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 flex items-center px-4 gap-4">
                            <Skeleton className="h-4 w-1/4 bg-white/5" />
                            <Skeleton className="h-4 w-1/4 bg-white/5" />
                            <Skeleton className="h-4 w-1/4 bg-white/5" />
                            <div className="w-1/4 flex justify-end gap-2">
                                <Skeleton className="h-8 w-8 rounded bg-white/5" />
                                <Skeleton className="h-8 w-8 rounded bg-white/5" />
                                <Skeleton className="h-8 w-8 rounded bg-white/5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
