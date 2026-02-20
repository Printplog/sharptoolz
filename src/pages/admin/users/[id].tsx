import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUserDetails, updateAdminUser } from "@/api/apiEndpoints";
import type { AdminUserDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import UserDetailSkeleton from "@/components/Admin/Users/UserDetailSkeleton";
import ProfileCard from "@/components/Admin/Users/UserDetails/ProfileCard";
import AccessManagement from "@/components/Admin/Users/UserDetails/AccessManagement";
import WalletActivity from "@/components/Admin/Users/UserDetails/WalletActivity";
import StatsOverview from "@/components/Admin/Users/UserDetails/StatsOverview";
import PurchaseHistory from "@/components/Admin/Users/UserDetails/PurchaseHistory";
import TransactionHistory from "@/components/Admin/Users/UserDetails/TransactionHistory";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, isLoading, error } = useQuery<AdminUserDetails>({
    queryKey: ["adminUserDetails", id],
    queryFn: () => adminUserDetails(id!),
    enabled: !!id,
  });

  const handleUpdateRole = async (newRole: string) => {
    if (!id || !data) return;

    setIsUpdating(true);
    try {
      await updateAdminUser(id, { role: newRole });
      queryClient.setQueryData<AdminUserDetails>(
        ["adminUserDetails", id],
        (old) =>
          old ? { ...old, user: { ...old.user, role: newRole } } : old
      );
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
      queryClient.setQueryData<AdminUserDetails>(
        ["adminUserDetails", id],
        (old) =>
          old ? { ...old, user: { ...old.user, is_active: newStatus } } : old
      );
      toast.success(
        `User ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );
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
            {error instanceof Error ? error.message : "User not found"}
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

      {/* User Profile & Role Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileCard user={user} />
        <AccessManagement
          user={user}
          isUpdating={isUpdating}
          onUpdateRole={handleUpdateRole}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <WalletActivity user={user} />
      <StatsOverview stats={stats} />

      {/* History Components */}
      <div className="space-y-6">
        <PurchaseHistory purchases={data.purchase_history} />
        <TransactionHistory transactions={data.transaction_history} />
      </div>
    </div>
  );
}
