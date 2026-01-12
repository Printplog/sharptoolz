import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolCardSkeleton() {
    return (
        <Card className="relative h-[400px] rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4 w-full flex flex-col">
            {/* Image placeholder */}
            <Skeleton className="w-full h-[250px] bg-white/5 rounded-lg mb-4" />

            <div className="space-y-3">
                {/* Title and Badge */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-1/2 bg-white/10" />
                    <Skeleton className="h-5 w-16 bg-white/10 rounded-full" />
                </div>

                {/* Description lines */}
                <Skeleton className="h-3 w-full bg-white/5" />
                <Skeleton className="h-3 w-4/5 bg-white/5" />
            </div>

            {/* Footer actions */}
            <div className="mt-auto flex justify-between items-center pt-4">
                <Skeleton className="h-8 w-24 bg-white/10" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
                    <Skeleton className="h-8 w-8 rounded-md bg-white/5" />
                </div>
            </div>
        </Card>
    );
}
