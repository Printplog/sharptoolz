// src/components/Dashboard/Wallet/PendingFundingNotice.tsx

import React, { useState } from "react";
import { AlertTriangle, Loader2, Copy, CheckCircle } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMutation } from "@tanstack/react-query";
import { cancelCryptoPayment } from "@/api/apiEndpoints";

const PendingFundingNotice: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { wallet } = useWalletStore();
  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => cancelCryptoPayment(id),
    onSuccess: () => {
        setCopied(false);
        console.log("Transaction cancelled successfully");
    }
  });

  const transaction = wallet?.transactions?.[0];

  if (!transaction || transaction.status !== "pending") return null;

  const { address } = transaction;

  const symbol = "USDT";
  const network = "BEP20 (Binance Smart Chain)";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onCancel = () => {
    mutate(transaction?.id);
    console.log("Transaction cancelled");
  };

  return (
    <div className="bg-white/5 border border-yellow-500/30 rounded-xl p-5 space-y-5">
      {/* Top Info */}
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
        <p className="text-yellow-300 font-medium">
          A fund transfer is being processed. Waiting for network confirmation.
        </p>
      </div>

      {/* Network Warning */}
      <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
        <AlertTriangle className="text-yellow-400 w-5 h-5 mt-0.5" />
        <div>
          <p className="text-sm text-yellow-300 mb-1">
            <strong>Send only {symbol}</strong> using the{" "}
            <strong>{network}</strong> network.
          </p>
          <p className="text-yellow-200/80 text-xs">
            Using another token or network will cause permanent loss of funds.
          </p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="space-y-2">
        {/* Address */}
        <div>
          <label className="text-white/60 text-sm block mb-1">
            Send Payment To
          </label>
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <span className="text-white text-sm font-mono break-all mr-2">
              {address}
            </span>
            <button
              onClick={copyToClipboard}
              className="p-1 text-white/60 hover:text-white transition-colors"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="pt-3">
        <button
          onClick={onCancel}
          disabled={isPending}
          className="w-full disabled:bg-red-300 bg-red-600 text-white py-2 rounded-lg hover:bg-red-500 transition-colors text-sm font-medium"
        >
            {isPending ? "Cancelling..." : "Cancel Payment"}
        </button>
      </div>
    </div>
  );
};

export default PendingFundingNotice;
