import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Download, Calendar } from "lucide-react";
import type { AdminUserDetails } from "@/types";

interface StatsOverviewProps {
    stats: AdminUserDetails["stats"];
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
    const statItems = [
        {
            icon: DollarSign,
            value: stats.total_purchases,
            label: "Total Purchases",
            color: "blue",
        },
        {
            icon: TrendingUp,
            value: stats.paid_purchases,
            label: "Paid Purchases",
            color: "green",
        },
        {
            icon: Download,
            value: stats.test_purchases,
            label: "Test Purchases",
            color: "orange",
        },
        {
            icon: Calendar,
            value: stats.days_since_joined,
            label: "Days Since Joined",
            color: "purple",
        },
    ];

    return (
        <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                    <TrendingUp className="h-5 w-5 text-slate-400" />
                    Statistics Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.label}
                                className={`text-center p-6 bg-gradient-to-br from-${item.color}-500/15 to-${item.color}-600/10 rounded-xl border border-${item.color}-500/25 hover:border-${item.color}-500/40 transition-colors`}
                            >
                                <div className={`w-12 h-12 bg-${item.color}-500/20 rounded-full flex items-center justify-center mx-auto mb-3`}>
                                    <Icon className={`h-6 w-6 text-${item.color}-300`} />
                                </div>
                                <div className={`text-3xl font-bold text-${item.color}-200 mb-1`}>
                                    {item.value}
                                </div>
                                <div className={`text-sm text-${item.color}-200/70 font-medium`}>
                                    {item.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
