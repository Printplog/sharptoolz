import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Wallet, Users, Download } from "lucide-react";
import type { AdminOverview } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface OverviewProps {
  data: AdminOverview | undefined;
  isLoading?: boolean;
}

export default function Overview({ data, isLoading }: OverviewProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ZK7T-93XY";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          "bg-primary/5",
          "bg-green-500/5",
          "bg-blue-500/5",
          "bg-purple-500/5",
        ].map((bg, i) => (
          <Card key={i} className={cn("border-white/10 backdrop-blur-sm", bg)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", isAdmin ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1")}>
      {/* Total Documents - Visible to Everyone */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Documents
          </CardTitle>
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <FileText className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data?.total_purchased_docs || 0}</p>
        </CardContent>
      </Card>

      {/* Restricted Cards - Admin Only */}
      {isAdmin && (
        <>
          {/* Wallet Balance */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Wallet Balance
              </CardTitle>
              <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                <Wallet className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${data?.total_wallet_balance || '0.00'}</p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="p-2 rounded-full bg-blue-500/20 text-blue-500">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.total_users || 0}</p>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <div className="p-2 rounded-full bg-purple-500/20 text-purple-500">
                <Download className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data?.total_downloads || 0}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 