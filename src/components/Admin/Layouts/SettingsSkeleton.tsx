import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsSkeleton() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-2">
                <Skeleton className="h-10 w-48 bg-white/10" />
                <Skeleton className="h-4 w-72 bg-white/5" />
            </div>

            <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-64 bg-white/5" />
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Form Fields */}
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <Skeleton className="h-4 w-40 bg-white/10" />
                            <Skeleton className={i === 2 ? "h-32 w-full bg-white/5" : "h-10 w-full bg-white/5"} />
                        </div>
                    ))}

                    <Skeleton className="h-10 w-32 bg-white/10" />
                </CardContent>
            </Card>
        </div>
    );
}
