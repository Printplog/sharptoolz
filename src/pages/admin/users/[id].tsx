import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminUserDetails } from "@/api/apiEndpoints";
import type { AdminUserDetails } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Mail,
  DollarSign,
  Download,
  Calendar,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { updateAdminUser } from "@/api/apiEndpoints";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import UserDetailSkeleton from "@/components/Admin/Users/UserDetailSkeleton";
import PurchaseHistory from "@/components/Admin/Users/UserDetails/PurchaseHistory";
import TransactionHistory from "@/components/Admin/Users/UserDetails/TransactionHistory";

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        const userData = await adminUserDetails(id);
        setData(userData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async (newRole: string) => {
    if (!id || !data) return;

    setIsUpdating(true);
    try {
      await updateAdminUser(id, { role: newRole });

      // Update local state
      setData({
        ...data,
        user: {
          ...data.user,
          role: newRole
        }
      });

      toast.success("User role updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !data) return;

    const newStatus = !data.user.is_active;
    setIsUpdating(true);
    try {
      await updateAdminUser(id, { is_active: newStatus });

      setData({
        ...data,
        user: {
          ...data.user,
          is_active: newStatus
        }
      });

      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <UserDetailSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 text-center">
            {error || "User not found"}
          </p>
        </div>
      </div>
    );
  }

  const { user, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/users">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
        </div>
      </div>

      {/* User Profile & Role Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-100">
              <User className="h-5 w-5 text-blue-400" />
              User Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <User className="h-8 w-8 text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {user.username}
                </h3>
                <div className="flex items-center gap-2 text-blue-200">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role & Access Management Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 backdrop-blur-sm h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-100">
              <Shield className="h-5 w-5 text-amber-400" />
              Access Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white/70">Account Role</span>
                  <span className="text-xs text-white/40 italic">Determines permission level</span>
                </div>
                <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                  <Button
                    onClick={() => handleUpdateRole("S9K3-41TV")}
                    disabled={isUpdating || user.role === "S9K3-41TV"}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-lg px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all",
                      user.role === "S9K3-41TV"
                        ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "text-white/30 hover:text-blue-400"
                    )}
                  >
                    Staff
                  </Button>
                  <Button
                    onClick={() => handleUpdateRole("LQ5D-21VM")}
                    disabled={isUpdating || user.role === "LQ5D-21VM"}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-lg px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all",
                      user.role === "LQ5D-21VM"
                        ? "bg-white/10 text-white shadow-lg"
                        : "text-white/30 hover:text-white"
                    )}
                  >
                    Standard
                  </Button>
                </div>
              </div>

              <div className="h-[1px] bg-white/5 w-full" />

              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-white/70">Account Status</span>
                  <span className="text-xs text-white/40 italic">Active or restricted access</span>
                </div>
                <Button
                  onClick={handleToggleStatus}
                  disabled={isUpdating}
                  className={cn(
                    "h-9 px-6 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95",
                    user.is_active
                      ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500"
                      : "bg-emerald-500 text-white border border-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  )}
                >
                  {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : (user.is_active ? "DEACTIVATE" : "ACTIVATE")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet & Activity Card */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-100">
            <DollarSign className="h-5 w-5 text-green-400" />
            Wallet & Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="text-2xl font-bold text-green-300 mb-1">
                ${user.wallet_balance}
              </div>
              <div className="text-sm text-green-200/70">Wallet Balance</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-300 mb-1">
                {user.total_purchases}
              </div>
              <div className="text-sm text-blue-200/70">Total Purchases</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-300 mb-1">
                {user.downloads}
              </div>
              <div className="text-sm text-purple-200/70">Downloads</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <TrendingUp className="h-5 w-5 text-slate-400" />
            Statistics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-gradient-to-br from-blue-500/15 to-blue-600/10 rounded-xl border border-blue-500/25 hover:border-blue-500/40 transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-blue-300" />
              </div>
              <div className="text-3xl font-bold text-blue-200 mb-1">
                {stats.total_purchases}
              </div>
              <div className="text-sm text-blue-200/70 font-medium">Total Purchases</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-500/15 to-green-600/10 rounded-xl border border-green-500/25 hover:border-green-500/40 transition-colors">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-300" />
              </div>
              <div className="text-3xl font-bold text-green-200 mb-1">
                {stats.paid_purchases}
              </div>
              <div className="text-sm text-green-200/70 font-medium">Paid Purchases</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-orange-500/15 to-orange-600/10 rounded-xl border border-orange-500/25 hover:border-orange-500/40 transition-colors">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-orange-300" />
              </div>
              <div className="text-3xl font-bold text-orange-200 mb-1">
                {stats.test_purchases}
              </div>
              <div className="text-sm text-orange-200/70 font-medium">Test Purchases</div>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-500/15 to-purple-600/10 rounded-xl border border-purple-500/25 hover:border-purple-500/40 transition-colors">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-purple-300" />
              </div>
              <div className="text-3xl font-bold text-purple-200 mb-1">
                {stats.days_since_joined}
              </div>
              <div className="text-sm text-purple-200/70 font-medium">Days Since Joined</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Components */}
      <div className="space-y-6">
        <PurchaseHistory purchases={data.purchase_history} />
        <TransactionHistory transactions={data.transaction_history} />
      </div>
    </div>
  );
}
