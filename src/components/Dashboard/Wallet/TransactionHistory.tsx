import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  History,
  XCircle,
  Loader2,
} from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMutation } from "@tanstack/react-query";
import { cancelCryptoPayment } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/ConfirmAction";
import type { Transaction } from "@/types";

const TransactionHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const { wallet } = useWalletStore();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => cancelCryptoPayment(id),
    onSuccess: () => {
      toast.success("Transaction cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel transaction");
    },
  });

  const transactions = wallet?.transactions as Transaction[];

  const totalPages = Math.ceil((transactions?.length ?? 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions?.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePreviousPage = (): void => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = (): void => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedTransactions?.map((transaction) => (
          <div
            key={transaction.id}
            className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg transition-all hover:bg-white/[0.07]"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${transaction.status === "completed"
                  ? (transaction.type === "deposit" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400")
                  : "bg-yellow-500/20 text-yellow-400"
                  }`}
              >
                {transaction.status === "pending" ? (
                  <History className="w-4 h-4" />
                ) : transaction.type === "deposit" ? (
                  <ArrowDownLeft className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {transaction.description}
                </p>
                <p className="text-white/40 text-xs text-mono tracking-tighter uppercase">
                  {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p
                  className={`text-sm font-medium ${transaction.status === "completed"
                    ? (transaction.type === "deposit" ? "text-green-400" : "text-blue-400")
                    : "text-yellow-400"
                    }`}
                >
                  {transaction.amount >= 0 ? "+" : ""}$
                  {Math.abs(transaction.amount).toFixed(2)}
                </p>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                  {transaction.status}
                </p>
              </div>

              {transaction.status === "pending" && (
                <ConfirmAction
                  title="Cancel Transaction?"
                  description="This will permanently cancel this funding request."
                  onConfirm={() => mutate(transaction.id)}
                  trigger={
                    <button
                      disabled={isPending}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                      title="Cancel Transaction"
                    >
                      {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                  }
                />
              )}
            </div>
          </div>
        ))}

        {transactions?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-20">
            <History className="w-10 h-10 mb-2" />
            <p className="text-xs uppercase font-black tracking-widest">No Transactions Found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">
            {startIndex + 1}-{Math.min(startIndex + itemsPerPage, transactions?.length)} / {transactions?.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-white/60 text-xs font-bold font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
