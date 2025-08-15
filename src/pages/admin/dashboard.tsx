import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminOverview } from "@/api/apiEndpoints";
import type { AdminOverview } from "@/types";
import IsLoading from "@/components/IsLoading";
import Overview from "@/components/Admin/Dashboard/Overview";

export default function Dashboard() {
  const { data, isLoading } = useQuery<AdminOverview>({
    queryFn: () => adminOverview(),
    queryKey: ["adminOverview"],
  });
  console.log(data);

  if (isLoading) return <IsLoading />;
  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <Overview data={data} />

      {/* Chart & Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Activity Chart Placeholder */}
        <Card className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
              <Activity className="h-10 w-10 text-muted-foreground opacity-30" />
              <span className="ml-2 text-sm text-muted-foreground">
                Chart goes here
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>New document created</span>
              <span className="text-xs text-muted-foreground">10m ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profile updated</span>
              <span className="text-xs text-muted-foreground">32m ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Payment received</span>
              <span className="text-xs text-muted-foreground">1h ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Login from new device</span>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
