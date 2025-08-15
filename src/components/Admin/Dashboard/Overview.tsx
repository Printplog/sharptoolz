import { Card, CardContent } from "@/components/ui/card";
import { FileText, Wallet, Users, Download } from "lucide-react";
import type { AdminOverview } from "@/types";

interface OverviewProps {
  data: AdminOverview | undefined;
}

export default function Overview({ data }: OverviewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Documents */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-sm text-blue-200/70">Total Documents</p>
              <p className="text-2xl font-bold text-blue-100">{data?.total_purchased_docs}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-sm text-green-200/70">Wallet Balance</p>
              <p className="text-2xl font-bold text-green-100">${data?.total_wallet_balance}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Users */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-sm text-purple-200/70">Active Users</p>
              <p className="text-2xl font-bold text-purple-100">{data?.total_users}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Downloads */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-orange-400" />
            <div>
              <p className="text-sm text-orange-200/70">Downloads</p>
              <p className="text-2xl font-bold text-orange-100">{data?.total_downloads}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 