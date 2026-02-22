// src/components/Dashboard/Wallet/PendingFundingNotice.tsx

import React, { useState } from "react";
import { AlertTriangle, Loader2, Copy, CheckCircle, MessageSquare, XCircle } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cancelCryptoPayment, getSiteSettings } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/ConfirmAction";
import type { SiteSettings } from "@/types";

const PendingFundingNotice: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  const { wallet } = useWalletStore();
  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => cancelCryptoPayment(id),
    onSuccess: () => {
      setCopied(false);
      toast.success("Transaction cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel transaction");
    },
  });

  const transaction = wallet?.transactions?.[0];
  if (!transaction || transaction.status !== "pending") return null;

  const { address, amount = 0 } = transaction;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onCancel = () => {
    mutate(transaction.id);
  };

  const handleWhatsApp = () => {
    const msg = `Hello. I want to buy ${amount} BNB. Send the BNB to this Binance Smart Chain wallet address: ${address}`;
    const encoded = encodeURIComponent(msg);
    const vendorNumber = siteSettings?.whatsapp_number || "2349160914217";
    const link = `https://wa.me/${vendorNumber}?text=${encoded}`;
    window.open(link, "_blank");
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-yellow-500/20 bg-yellow-500/[0.03] backdrop-blur-3xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          <span className="text-white text-xs font-black uppercase tracking-widest italic">Incomplete Funding</span>
        </div>
        <AlertTriangle className="w-4 h-4 text-yellow-500/50" />
      </div>

      <div className="space-y-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/40 text-xs font-black uppercase tracking-widest">Payment Address</span>
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-black uppercase tracking-tighter">
              BEP20
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 bg-black/20 rounded-xl p-3 border border-white/5">
            <span className="text-white text-xs font-mono truncate">{address}</span>
            <button onClick={copyToClipboard} className="shrink-0 text-white/40 hover:text-white transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-white/40 leading-relaxed italic">
            Send only <span className="text-yellow-500 font-bold uppercase tracking-tighter">USDT (BEP20)</span> to avoid loss of funds.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Pay on WhatsApp
        </button>

        <ConfirmAction
          title="Cancel Payment?"
          description="Action cannot be undone."
          trigger={
            <button
              disabled={isPending}
              className="px-6 flex items-center justify-center bg-white/5 text-white/40 border border-white/5 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 mr-2" />
              {isPending ? "..." : "Cancel"}
            </button>
          }
          onConfirm={onCancel}
        />
      </div>
    </div>
  );
};

export default PendingFundingNotice;
