import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-32 bg-white/10" />
            </div>

            {/* User Profile Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-32 bg-white/10" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-16 h-16 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-8 w-48 bg-white/10" />
                            <Skeleton className="h-4 w-64 bg-white/5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Wallet & Activity Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-40 bg-white/10" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                                <Skeleton className="h-8 w-24 bg-white/10 mx-auto mb-1" />
                                <Skeleton className="h-4 w-20 bg-white/5 mx-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Overview */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-44 bg-white/10" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="text-center p-6 bg-white/5 rounded-xl border border-white/10">
                                <Skeleton className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-3" />
                                <Skeleton className="h-8 w-16 bg-white/10 mx-auto mb-1" />
                                <Skeleton className="h-4 w-24 bg-white/5 mx-auto" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* History Components Placeholders */}
            <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader><Skeleton className="h-6 w-40 bg-white/10" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full bg-white/5" /></CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader><Skeleton className="h-6 w-40 bg-white/10" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full bg-white/5" /></CardContent>
                </Card>
            </div>
        </div>
    );
}
