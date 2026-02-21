import React, { useState } from "react";
import { Plus, Receipt, History } from "lucide-react";
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase italic">
          My <span className="text-primary">Wallet</span>
        </h1>

        <button
          onClick={handleOpenAddFunds}
          className="group relative flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl hover:bg-white/90 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[11px] font-black uppercase tracking-widest">Add Funds</span>
        </button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Column: Balance & Pending */}
        <div className="xl:col-span-5 space-y-8">
          <BalanceCard
            balance={Number(wallet?.balance)}
            onTopUp={handleOpenAddFunds}
          />

          {wallet?.transactions?.[0]?.status === "pending" && (
            <PendingFundingNotice />
          )}
        </div>

        {/* Right Column: Transaction Log */}
        <div className="xl:col-span-7">
          <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl transition-all duration-500 hover:border-white/20 shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white/40" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight italic uppercase">
                    History
                  </h2>
                </div>
              </div>
              <History className="w-4 h-4 text-white/10" />
            </div>

            <div className="p-8">
              <TransactionHistory />
            </div>
          </div>
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
