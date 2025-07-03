import React, { useState } from "react";
import { Plus, Receipt } from "lucide-react";
import AddFundsDialog from "@/components/Dashboard/Wallet/AddFundsDialog";
import TransactionHistory from "@/components/Dashboard/Wallet/TransactionHistory";
import BalanceCard from "@/components/Dashboard/Wallet/BalanceCard";
import { useWalletStore } from "@/store/walletStore";
import { useWalletSocket } from "@/hooks/useWalletSocket";
import PendingFundingNotice from "@/components/Dashboard/Wallet/PendingFundingNotice";
import SuccessPaymentDialog from "@/components/Dashboard/Wallet/SuccessPaymentDialog";
import { toast } from "sonner";
import LoadingWallet from "@/components/Dashboard/Wallet/LoadingWallet";

const WalletPage: React.FC = () => {
  const [showAddFundsDialog, setShowAddFundsDialog] = useState<boolean>(false);
  useWalletSocket();
  const { wallet } = useWalletStore();

  const handleOpenAddFunds = (): void => {
    if (wallet?.transactions?.[0]?.status === "pending") {
      toast.warning("You have a pending transaction. Please wait until it is completed before adding more funds.");
      return;
    }
    setShowAddFundsDialog(true);
  };

  const handleCloseAddFunds = (open: boolean): void => {
    setShowAddFundsDialog(open);
  };

  if (!wallet) return <LoadingWallet />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Wallet</h1>
        <button
          onClick={handleOpenAddFunds}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Funds
        </button>
      </div>

      {/* Balance Card */}
      <BalanceCard
        balance={Number(wallet?.balance)}
        onTopUp={handleOpenAddFunds}
      />

      {wallet?.transactions?.[0]?.status === "pending" && (
        <PendingFundingNotice />
      )}

      {/* Transaction History */}
      <div className="bg-white/5 border border-white/10 rounded-lg">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-white/60" />
            <h2 className="text-lg font-medium text-white">
              Transaction History
            </h2>
          </div>
        </div>
        <div className="p-6">
          <TransactionHistory />
        </div>
      </div>

      {/* Add Funds Dialog */}
      <AddFundsDialog
        open={showAddFundsDialog}
        onOpenChange={handleCloseAddFunds}
      />

      <SuccessPaymentDialog />
    </div>
  );
};

export default WalletPage;
