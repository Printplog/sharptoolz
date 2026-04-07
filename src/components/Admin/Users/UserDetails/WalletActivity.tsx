import { DollarSign, Wallet, Download } from "lucide-react";
import type { AdminUserDetails } from "@/types";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";

interface WalletActivityProps {
    user: AdminUserDetails["user"];
}

export default function WalletActivity({ user }: WalletActivityProps) {
    const statItems: StatData[] = [
        {
            title: "Wallet Balance",
            value: `$${user.wallet_balance}`,
            label: "Available funds",
            icon: Wallet,
            gradient: "from-blue-500/20 to-blue-600/5",
            borderColor: "border-blue-500/20",
            iconBg: "bg-blue-500/10",
            iconColor: "text-blue-400",
        },
        {
            title: "Total Purchases",
            value: user.total_purchases,
            label: "Lifetime orders",
            icon: DollarSign,
            gradient: "from-indigo-500/20 to-indigo-600/5",
            borderColor: "border-indigo-500/20",
            iconBg: "bg-indigo-500/10",
            iconColor: "text-indigo-400",
        },
        {
            title: "Downloads",
            value: user.downloads,
            label: "Files retrieved",
            icon: Download,
            gradient: "from-purple-500/20 to-purple-600/5",
            borderColor: "border-purple-500/20",
            iconBg: "bg-purple-500/10",
            iconColor: "text-purple-400",
        },
    ];

    return (
        <StatsCards 
            stats={statItems} 
            className="lg:grid-cols-3 mb-8" 
        />
    );
}
