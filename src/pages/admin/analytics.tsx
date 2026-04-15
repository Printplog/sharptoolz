import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics, adminOverview } from "@/api/apiEndpoints";
import WalletFlowChart from "@/components/Admin/Dashboard/WalletFlowChart";
import VisitorChart from "@/components/Admin/Dashboard/VisitorChart";
import RecentVisitors from "@/components/Admin/Dashboard/RecentVisitors";
import DeviceStatsChart from "@/components/Admin/Dashboard/DeviceStatsChart";
import UserGrowthChart from "@/components/Admin/Dashboard/UserGrowthChart";
import DistributionChart from "@/components/Admin/Dashboard/DistributionChart";
import type { AdminOverview } from "@/types";
import AnalyticsSkeleton from "@/components/Admin/Layouts/AnalyticsSkeleton";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
] as const;

export default function Analytics() {
  const [days, setDays] = useState(30);

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
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

  if (isAnalyticsLoading || isOverviewLoading) return <AnalyticsSkeleton />;

  return (
    <div className="dashboard-content space-y-6 p-6">
      {/* Header + range selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
          Platform <span className="text-primary">Analytics</span>
        </h1>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[400px]">
          <VisitorChart data={chartData} isLoading={isAnalyticsLoading} />
        </div>

        <div className="h-[400px]">
          <WalletFlowChart data={chartData} isLoading={isAnalyticsLoading} />
        </div>

        <div className="h-[400px]">
          <DeviceStatsChart data={deviceStats} isLoading={isAnalyticsLoading} />
        </div>

        <div className="h-[400px]">
          <UserGrowthChart data={overviewData?.revenue_chart} isLoading={isOverviewLoading} />
        </div>

        <div className="h-[400px]">
          <DistributionChart data={overviewData?.documents_chart} isLoading={isOverviewLoading} />
        </div>
      </div>

      <div className="mt-8">
        <RecentVisitors data={visitorLog} isLoading={isAnalyticsLoading} />
      </div>
    </div>
  );
}
