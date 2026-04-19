import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Eye, HandCoins, Users } from "lucide-react";
import { getAdminAnalytics, adminOverview } from "@/api/apiEndpoints";
import WalletFlowChart from "@/components/Admin/Dashboard/WalletFlowChart";
import VisitorChart from "@/components/Admin/Dashboard/VisitorChart";
import RecentVisitors from "@/components/Admin/Dashboard/RecentVisitors";
import DeviceStatsChart from "@/components/Admin/Dashboard/DeviceStatsChart";
import UserGrowthChart from "@/components/Admin/Dashboard/UserGrowthChart";
import DistributionChart from "@/components/Admin/Dashboard/DistributionChart";
import TopPagesChart from "@/components/Admin/Dashboard/TopPagesChart";
import type { AdminOverview } from "@/types";
import AnalyticsSkeleton from "@/components/Admin/Layouts/AnalyticsSkeleton";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
] as const;

interface AnalyticsResponse {
  chart_data: Array<{
    date: string;
    total_visits: number;
    unique_visitors: number;
    total_sales: number;
    total_revenue: number;
  }>;
  recent_visitors: Array<{
    ip_address: string | null;
    path: string;
    timestamp: string;
    user__username: string | null;
    method: string;
    visit_count: number;
  }>;
  device_stats: Array<{
    device: string;
    count: number;
  }>;
  top_pages: Array<{
    path: string;
    visits: number;
  }>;
  summary: {
    total_visits: number;
    unique_visitors: number;
    authenticated_visits: number;
    guest_visits: number;
    total_sales: number;
    total_revenue: number;
    conversion_rate: number;
  };
  range_days: number;
  range_label: string;
}

export default function Analytics() {
  const [days, setDays] = useState(1);

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery<AnalyticsResponse>({
    queryFn: () => getAdminAnalytics(days),
    queryKey: ["adminAnalytics", days],
  });

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery<AdminOverview>({
    queryFn: () => adminOverview(days),
    queryKey: ["adminOverview", days],
  });

  const chartData = analyticsData?.chart_data;
  const visitorLog = analyticsData?.recent_visitors;
  const deviceStats = analyticsData?.device_stats;
  const rangeLabel = analyticsData?.range_label || "Today";
  const summary = analyticsData?.summary;

  const summaryCards: StatData[] = [
    {
      title: "Total Visits",
      value: summary?.total_visits ?? 0,
      label: `${rangeLabel} traffic`,
      icon: Eye,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-300",
    },
    {
      title: "Unique Visitors",
      value: summary?.unique_visitors ?? 0,
      label: `${summary?.authenticated_visits ?? 0} signed-in visits`,
      icon: Users,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-300",
    },
    {
      title: "Orders",
      value: summary?.total_sales ?? 0,
      label: `${summary?.conversion_rate ?? 0}% visitor-to-sale`,
      icon: HandCoins,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
    },
    {
      title: "Revenue",
      value: `$${(summary?.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      label: `${summary?.guest_visits ?? 0} guest visits`,
      icon: DollarSign,
      gradient: "from-amber-500/20 to-amber-600/5",
      borderColor: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-200",
    },
  ];

  if (isAnalyticsLoading || isOverviewLoading) return <AnalyticsSkeleton />;

  return (
    <div className="dashboard-content space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Platform <span className="text-primary">Analytics</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-white/40 italic">
            Focused performance signals for {rangeLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                days === r.days
                  ? "bg-primary text-black shadow"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <StatsCards stats={summaryCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <VisitorChart data={chartData} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        </div>

        <div className="h-[400px]">
          <WalletFlowChart data={chartData} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        </div>

        <div className="h-[400px]">
          <DeviceStatsChart data={deviceStats} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        </div>

        <div className="h-[400px]">
          <UserGrowthChart data={overviewData?.revenue_chart} isLoading={isOverviewLoading} rangeLabel={rangeLabel} />
        </div>

        <div className="h-[400px]">
          <TopPagesChart data={analyticsData?.top_pages} rangeLabel={rangeLabel} />
        </div>

        <div className="h-[400px]">
          <DistributionChart data={overviewData?.documents_chart} isLoading={isOverviewLoading} />
        </div>
      </div>

      <div className="mt-8">
        <RecentVisitors data={visitorLog} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
      </div>
    </div>
  );
}
