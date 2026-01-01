import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics, adminOverview } from "@/api/apiEndpoints";
import IsLoading from "@/components/IsLoading";
import WalletFlowChart from "@/components/Admin/Dashboard/WalletFlowChart";
import VisitorChart from "@/components/Admin/Dashboard/VisitorChart";
import RecentVisitors from "@/components/Admin/Dashboard/RecentVisitors";
import DeviceStatsChart from "@/components/Admin/Dashboard/DeviceStatsChart";
import UserGrowthChart from "@/components/Admin/Dashboard/UserGrowthChart";
import DistributionChart from "@/components/Admin/Dashboard/DistributionChart";
import type { AdminOverview } from "@/types";

export default function Analytics() {
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({ 
    queryFn: () => getAdminAnalytics(),
    queryKey: ["adminAnalytics"],
  });

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery<AdminOverview>({
      queryFn: () => adminOverview(),
      queryKey: ["adminOverview"],
  });

  if (isAnalyticsLoading || isOverviewLoading) return <IsLoading />;

  // Transform data for charts
  const chartData = analyticsData?.chart_data;
  const visitorLog = analyticsData?.recent_visitors;
  const deviceStats = analyticsData?.device_stats;

  return (
    <div className="space-y-6 w-full p-6">
      <h1 className="text-3xl font-bold text-white mb-8">Platform Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1 */}
        <div className="h-[400px]">
             <VisitorChart data={chartData} />
        </div>

        <div className="h-[400px]">
            <WalletFlowChart data={chartData} />
        </div>

        <div className="h-[400px]">
            <DeviceStatsChart data={deviceStats} />
        </div>

        <div className="h-[400px]">
            <UserGrowthChart data={overviewData?.revenue_chart} />
        </div>

        <div className="h-[400px]">
            <DistributionChart data={overviewData?.documents_chart} />
        </div>
        
      </div>
      
      {/* Detailed Stats Table */}
      <div className="mt-8">
        <RecentVisitors data={visitorLog} />
      </div>
    </div>
  );
}
