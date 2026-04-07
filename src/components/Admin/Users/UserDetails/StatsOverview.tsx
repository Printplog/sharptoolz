import { TrendingUp, DollarSign, Download, Wallet } from "lucide-react";
import type { AdminUserDetails } from "@/types";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";

interface StatsOverviewProps {
    stats: AdminUserDetails["stats"];
    walletBalance?: string | number;
}

export default function StatsOverview({ stats, walletBalance }: StatsOverviewProps) {
    const statItems: StatData[] = [
        ...(walletBalance !== undefined ? [{
            title: "Wallet Balance",
            value: `$${walletBalance}`,
            label: "Current user funds",
            icon: Wallet,
            gradient: "from-blue-500/20 to-blue-600/5",
            borderColor: "border-blue-500/20",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-400",
        }] : []),
        {
            title: "Total Purchases",
            value: stats.total_purchases,
            label: "Lifetime orders",
            icon: DollarSign,
            gradient: "from-indigo-500/20 to-indigo-600/5",
            borderColor: "border-indigo-500/20",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-400",
        },
        {
            title: "Paid Purchases",
            value: stats.paid_purchases,
            label: "Completed payments",
            icon: TrendingUp,
            gradient: "from-green-500/20 to-green-600/5",
            borderColor: "border-green-500/20",
            iconBg: "bg-green-500/10",
            iconColor: "text-green-400",
        },
        {
            title: "Test Purchases",
            value: stats.test_purchases,
            label: "System tests",
            icon: Download,
            gradient: "from-orange-500/20 to-orange-600/5",
            borderColor: "border-orange-500/20",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-400",
        },
    ];

    return (
        <StatsCards 
            stats={statItems} 
            className="lg:grid-cols-4 mb-8" 
        />
    );
}
