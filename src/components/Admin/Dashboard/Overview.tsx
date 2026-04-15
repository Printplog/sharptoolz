import { FileText, Wallet, Users, Download } from "lucide-react";
import type { AdminOverview } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/authStore";
import { isAdmin as checkAdmin, isAdminOrStaff } from "@/lib/constants/roles";

interface OverviewProps {
  data: AdminOverview | undefined;
  isLoading?: boolean;
}

export default function Overview({ data, isLoading }: OverviewProps) {
  const { user } = useAuthStore();
  const isAdmin = checkAdmin(user?.role);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { gradient: "from-primary/20 to-primary/5", border: "border-primary/20" },
          { gradient: "from-blue-500/20 to-blue-600/5", border: "border-blue-500/20" },
          { gradient: "from-purple-500/20 to-purple-600/5", border: "border-purple-500/20" },
          { gradient: "from-green-500/20 to-green-600/5", border: "border-green-500/20" },
        ].map((style, i) => (
          <div key={i} className={`bg-gradient-to-br ${style.gradient} ${style.border} border rounded-2xl p-6 backdrop-blur-md`}>
            <Skeleton className="h-10 w-10 rounded-lg bg-white/10 mb-4" />
            <Skeleton className="h-3 w-24 rounded-full bg-white/10 mb-2" />
            <Skeleton className="h-8 w-32 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Documents - Visible to Everyone */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
            Total Documents
          </p>
          <p className="text-2xl font-black text-white">{data?.total_purchased_docs || 0}</p>
          <p className="text-xs text-white/40 mt-1">Paid purchases</p>
        </div>
      </div>

      {/* Regular Users - Visible to Admin & Staff */}
      {isAdminOrStaff(user?.role) && (
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border-blue-500/20 border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Real Users</p>
            <p className="text-2xl font-black text-white">{data?.regular_users ?? 0}</p>
            <p className="text-xs text-white/40 mt-1">Non-staff accounts</p>
          </div>
        </div>
      )}

      {/* Downloads - Visible to Admin & Staff */}
      {isAdminOrStaff(user?.role) && (
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 border-purple-500/20 border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
              <Download className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Downloads</p>
            <p className="text-2xl font-black text-white">{data?.total_downloads || 0}</p>
            <p className="text-xs text-white/40 mt-1">Total downloads</p>
          </div>
        </div>
      )}

      {/* Wallet Balance (users only) - Admin Only */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/5 border-green-500/20 border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
              User Wallets
            </p>
            <p className="text-2xl font-black text-white">${data?.total_wallet_balance || '0.00'}</p>
            <p className="text-xs text-white/40 mt-1">Excl. admin balances</p>
          </div>
        </div>
      )}
    </div>
  );
} 