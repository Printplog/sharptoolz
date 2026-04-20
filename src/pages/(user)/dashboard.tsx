import HotTools from "@/components/Dashboard/Dashboard/HotTools";
import QuickActions from "@/components/Dashboard/Dashboard/QuickActions";
import { useAuthStore } from "@/store/authStore";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import { FileText, Wallet, CloudDownload } from "lucide-react";


export default function Dashboard() {
  const { user } = useAuthStore();

  const userStats: StatData[] = [
    {
      title: "Total Documents",
      value: user?.total_purchases || 0,
      label: "Purchased items",
      icon: FileText,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
    },
    {
      title: "Wallet Balance",
      value: `$${user?.wallet_balance || "0.00"}`,
      label: "Available credit",
      icon: Wallet,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Downloads",
      value: user?.downloads || 0,
      label: "Total exported files",
      icon: CloudDownload,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    }
  ];

  return (
    <div className="dashboard-content space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
          User <span className="text-primary">Dashboard</span>
        </h1>
        <p className="mt-1 text-sm font-medium text-white/40 italic">
          Welcome back, {user?.first_name || user?.username || "Value Visitor"}
        </p>
      </div>

      {/* Analytics Cards */}
      <StatsCards stats={userStats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Hot Tools - only shows if there are hot tools */}
      <HotTools />
    </div>
  );
}