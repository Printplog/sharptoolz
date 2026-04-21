import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUserDetails, updateAdminUser } from "@/api/apiEndpoints";
import type { AdminUserDetails } from "@/types";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ArrowLeft, User, Wallet, History, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import UserDetailSkeleton from "@/components/Admin/Users/UserDetailSkeleton";
import ProfileCard from "@/components/Admin/Users/UserDetails/ProfileCard";
import AccessManagement from "@/components/Admin/Users/UserDetails/AccessManagement";
import WalletActivity from "@/components/Admin/Users/UserDetails/WalletActivity";
import StatsOverview from "@/components/Admin/Users/UserDetails/StatsOverview";
import PurchaseHistory from "@/components/Admin/Users/UserDetails/PurchaseHistory";
import TransactionHistory from "@/components/Admin/Users/UserDetails/TransactionHistory";
import { CustomTabs, CustomTabsContent } from "@/components/ui/custom-tabs";
import AdjustBalanceDialog from "@/components/Admin/Wallet/Modals/AdjustBalanceDialog";
import { postApi } from "@/api/apiEndpoints";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

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

  const handleAdjustBalance = async (walletId: string, type: 'credit' | 'debit', amount: number, reason: string) => {
    if (!id) return;
    
    setIsUpdating(true);
    try {
      await postApi('/admin/wallet/adjust/', {
        walletId,
        type,
        amount,
        reason
      });
      
      await queryClient.invalidateQueries({ queryKey: ["adminUserDetails", id] });
      toast.success("Wallet balance adjusted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust balance");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <UserDetailSkeleton />;

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <PremiumButton
            href="/admin/users"
            text="Back to Users"
            icon={ArrowLeft}
            variant="outline"
            className="border-white/10"
          />
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

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "access", label: "Access", icon: ShieldCheck },
    { id: "financials", label: "Financials", icon: Wallet },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="dashboard-content space-y-10">
      {/* Header */}
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-6">
          <Link to="/admin/users">
            <Button
              variant="outline"
              size="icon"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full w-12 h-12 shrink-0 transition-transform active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
              {user.username}
            </h1>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              User Administrative Controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PremiumButton
            onClick={() => setShowAdjustDialog(true)}
            text="MANAGE FUNDS"
            icon={Wallet}
            variant="outline"
            className="border-white/10"
          />
        </div>

        <CustomTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          className="mx-0"
        />
      </div>

      <div className="mt-8">
        <CustomTabsContent value="overview" activeTab={activeTab} className="space-y-8">
          <StatsOverview stats={stats} walletBalance={user.wallet_balance} />
          <ProfileCard user={user} />
        </CustomTabsContent>

        <CustomTabsContent value="access" activeTab={activeTab} className="space-y-6">
          <AccessManagement
            user={user}
            isUpdating={isUpdating}
            onUpdateRole={handleUpdateRole}
            onToggleStatus={handleToggleStatus}
          />
        </CustomTabsContent>

        <CustomTabsContent value="financials" activeTab={activeTab} className="space-y-6">
          <WalletActivity user={user} />
          <TransactionHistory transactions={data.transaction_history} />
        </CustomTabsContent>

        <CustomTabsContent value="history" activeTab={activeTab} className="space-y-6">
          <PurchaseHistory purchases={data.purchase_history} />
        </CustomTabsContent>
      </div>

      <AdjustBalanceDialog
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        wallet={data ? {
          id: data.wallet.id,
          balance: data.wallet.balance,
          status: 'active',
          user: {
            id: String(data.user.pk),
            username: data.user.username,
            email: data.user.email
          }
        } : null}
        onSubmit={handleAdjustBalance}
      />
    </div>
  );
}
