import {
  FileText,
  Wallet,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";

export default function Stats() {
  const { user } = useAuthStore();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Documents */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
          <div className="p-2 rounded-full bg-primary/20 text-primary">
            <FileText className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{user?.total_purchases}</p>
          <p className="text-sm font-medium text-white/60">
            Documents purchased
          </p>
        </CardContent>
      </Card>

      {/* Wallet Balance */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
          <div className="p-2 rounded-full bg-green-500/20 text-green-500">
            <Wallet className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">${user?.wallet_balance}</p>
          <p className="text-sm font-medium text-white/60">
            Available for purchases
          </p>
        </CardContent>
      </Card>

      {/* Downloads */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Downloads</CardTitle>
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-500">
            <Download className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{user?.downloads}</p>
          <p className="text-sm font-medium text-white/60">
            All-time downloads
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
