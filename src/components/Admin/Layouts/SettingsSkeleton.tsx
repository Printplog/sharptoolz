import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsSkeleton() {
    return (
        <div className="dashboard-content space-y-8 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 bg-white/10 rounded-xl" />
                    <Skeleton className="h-4 w-80 bg-white/5 rounded-lg" />
                </div>
                <Skeleton className="h-14 w-48 bg-white/10 rounded-2xl" />
            </div>

            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32 bg-white/10 rounded-xl" />
                ))}
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-3xl overflow-hidden rounded-[2rem] border-t-primary/20">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 pt-8 pb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 bg-primary/10 rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48 bg-white/10" />
                            <Skeleton className="h-4 w-80 bg-white/5" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-4 w-32 bg-white/10 rounded-lg" />
                                <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-40 bg-white/10 rounded-lg" />
                        <Skeleton className="h-32 w-full bg-white/5 rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
