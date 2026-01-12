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
} from "lucide-react";
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

      {/* User Profile Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
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
