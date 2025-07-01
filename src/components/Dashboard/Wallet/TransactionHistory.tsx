import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import type { Transaction } from "@/types";

const TransactionHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const { wallet } = useWalletStore();

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
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  transaction.status === "completed"
                    ? "bg-green-500/20 text-green-400"
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
                <p className="text-white/40 text-xs">
                  {new Date(transaction.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  transaction.status === "completed"
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {transaction.amount > 0 ? "+" : ""}$
                {Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-white/40 text-xs capitalize">
                {transaction.status}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-white/60 text-sm">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, transactions?.length)} of{" "}
          {transactions?.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/60 text-sm">
            {currentPage} of {totalPages}
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
    </div>
  );
};

export default TransactionHistory;
