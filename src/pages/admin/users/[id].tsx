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
import AdminLoading from "@/components/Admin/AdminLoading";
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

  if (isLoading) return <AdminLoading />;

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

      {/* User Info Card */}
      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-400" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {user.username}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-white">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 border rounded-xl bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wallet Balance:</span>
                <span className="text-green-400 font-semibold">
                  ${user.wallet_balance}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Purchases:</span>
                <span className="text-white font-semibold">
                  {user.total_purchases}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Downloads:</span>
                <span className="text-white font-semibold">
                  {user.downloads}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-blue-200/70">Total Purchases</p>
                <p className="text-2xl font-bold text-blue-100">
                  {stats.total_purchases}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-green-200/70">Paid Purchases</p>
                <p className="text-2xl font-bold text-green-100">
                  {stats.paid_purchases}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-sm text-orange-200/70">Test Purchases</p>
                <p className="text-2xl font-bold text-orange-100">
                  {stats.test_purchases}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-purple-200/70">Days Since Joined</p>
                <p className="text-2xl font-bold text-purple-100">
                  {stats.days_since_joined}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Components */}
      <div className="space-y-6">
        <PurchaseHistory purchases={data.purchase_history} />
        <TransactionHistory transactions={data.transaction_history} />
      </div>
    </div>
  );
}
