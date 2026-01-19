import { useQuery } from "@tanstack/react-query";
import { adminOverview, getAdminAnalytics } from "@/api/apiEndpoints";
import type { AdminOverview } from "@/types";
import Overview from "@/components/Admin/Dashboard/Overview";
import WalletFlowChart from "@/components/Admin/Dashboard/WalletFlowChart";
import VisitorChart from "@/components/Admin/Dashboard/VisitorChart";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function Dashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ZK7T-93XY";

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery<AdminOverview>({
    queryFn: () => adminOverview(),
    queryKey: ["adminOverview"],
  });

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryFn: () => getAdminAnalytics(),
    queryKey: ["adminAnalytics"],
  });

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <Overview data={overviewData} isLoading={isOverviewLoading} />

      {/* Charts Section - Admin Only */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Wallet / Money Inflow */}
            <WalletFlowChart data={analyticsData?.chart_data} isLoading={isAnalyticsLoading} />

            {/* Visitor Traffic */}
            <VisitorChart data={analyticsData?.chart_data} isLoading={isAnalyticsLoading} />
          </div>

          <div className="flex justify-end">
            <Link to="/admin/analytics">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                View All Analytics
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
