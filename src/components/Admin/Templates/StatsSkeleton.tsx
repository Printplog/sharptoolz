import { Skeleton } from "@/components/ui/skeleton";

export default function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-4 w-24 bg-white/10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
                    </div>
                    <Skeleton className="h-10 w-20 bg-white/10 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-32 bg-white/5 rounded-full" />
                </div>
            ))}
        </div>
    );
}
