import { FileText, Wallet, Users, Download } from "lucide-react";
import type { AdminOverview } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { isAdmin as checkAdmin, isAdminOrStaff } from "@/lib/constants/roles";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";

interface OverviewProps {
  data: AdminOverview | undefined;
  isLoading?: boolean;
}

export default function Overview({ data, isLoading }: OverviewProps) {
  const { user } = useAuthStore();
  const isAdmin = checkAdmin(user?.role);

  const stats: StatData[] = [
    {
      title: "Total Documents",
      value: data?.total_purchased_docs || 0,
      label: "Paid purchases",
      icon: FileText,
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    ...(isAdminOrStaff(user?.role)
      ? [
          {
            title: "Real Users",
            value: data?.regular_users ?? 0,
            label: "Non-staff accounts",
            icon: Users,
            gradient: "from-emerald-500/20 to-emerald-600/5",
            borderColor: "border-emerald-500/20",
            iconBg: "bg-emerald-500/10",
            iconColor: "text-emerald-400",
          },
          {
            title: "Downloads",
            value: data?.total_downloads || 0,
            label: "Total downloads",
            icon: Download,
            gradient: "from-orange-500/20 to-orange-600/5",
            borderColor: "border-orange-500/20",
            iconBg: "bg-orange-500/10",
            iconColor: "text-orange-400",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "User Wallets",
            value: `$${data?.total_wallet_balance || "0.00"}`,
            label: "Excl. admin balances",
            icon: Wallet,
            gradient: "from-red-500/20 to-red-600/5",
            borderColor: "border-red-500/20",
            iconBg: "bg-red-500/10",
            iconColor: "text-red-400",
          },
        ]
      : []),
  ];

  return <StatsCards stats={stats} isLoading={isLoading} />;
} 
