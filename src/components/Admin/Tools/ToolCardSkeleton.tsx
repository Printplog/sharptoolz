import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ToolCardSkeleton() {
    return (
        <Card className="relative h-[400px] rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-4 w-full flex flex-col">
            {/* Box 1: Top button/image placeholder */}
            <Skeleton className="w-full h-[240px] bg-white/5 rounded-lg mb-6" />

            <div className="space-y-4 px-1">
                {/* Box 2: Name and is hot or not boxes */}
                <div className="flex justify-between items-center gap-4">
                    <Skeleton className="h-5 w-2/3 bg-white/10 rounded-md" />
                    <Skeleton className="h-5 w-10 bg-white/10 rounded-full" />
                </div>
            </div>

            {/* Box 3: Button at the base */}
            <div className="mt-auto px-1 pb-1">
                <Skeleton className="h-11 w-full bg-white/10 rounded-lg" />
            </div>
        </Card>
    );
}
