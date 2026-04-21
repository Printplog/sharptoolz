import React, { useState, useEffect } from "react";
import { AlertTriangle, Loader2, Copy, CheckCircle, MessageSquare, XCircle, Wallet, AlertCircle } from "lucide-react";
import { useWalletStore } from "@/store/walletStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cancelCryptoPayment, getSiteSettings } from "@/api/apiEndpoints";
import { fetchUsdToNgn } from "@/api/exchangeRate";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SiteSettings } from "@/types";
import { QRCodeSVG } from 'qrcode.react';

const PendingFundingNotice: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showAmountDialog, setShowAmountDialog] = useState(false);
  const [amountNaira, setAmountNaira] = useState("");
  const [usdToNgn, setUsdToNgn] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  const adminFallbackRate = Number(siteSettings?.exchange_rate_override) || 1650;
  const minTopupUsd = Number(siteSettings?.min_topup_amount) || 5;

  useEffect(() => {
    const loadRate = async () => {
      setRateLoading(true);
      const rate = await fetchUsdToNgn(adminFallbackRate);
      setUsdToNgn(rate);
      setRateLoading(false);
    };
    loadRate();
  }, [adminFallbackRate]);

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

  const { address } = transaction;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onCancel = () => {
    mutate(transaction.id);
  };

  const handleWhatsAppRedirect = () => {
    if (!amountNaira || !usdToNgn) return;
    const usdVal = (parseFloat(amountNaira) / usdToNgn).toFixed(2);

    if (parseFloat(usdVal) < minTopupUsd) {
      toast.error(`Minimum top-up is $${minTopupUsd} (~₦${(minTopupUsd * usdToNgn).toLocaleString()})`);
      return;
    }

    const msg = `Hello. I want to fund my Sharptoolz wallet with ₦${parseFloat(amountNaira).toLocaleString('en-NG')} (≈ $${usdVal} USD). Please confirm and send the equivalent USDT to this BEP20 address: ${address}`;
    const encoded = encodeURIComponent(msg);
    const vendorNumber = siteSettings?.funding_whatsapp_number || siteSettings?.whatsapp_number || "2349160914217";
    const link = `https://wa.me/${vendorNumber}?text=${encoded}`;
    window.open(link, "_blank");
    setShowAmountDialog(false);
  };

  const equivalentUsd = amountNaira && usdToNgn ? (parseFloat(amountNaira) / usdToNgn).toFixed(2) : null;
  const isBelowMin = equivalentUsd && parseFloat(equivalentUsd) < minTopupUsd;

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

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-2 rounded-xl shadow-xl shadow-yellow-500/10 border border-white/10">
              <QRCodeSVG 
                value={address} 
                size={140}
                level="H"
                includeMargin={false}
                className="rounded-lg"
              />
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
          onClick={() => setShowAmountDialog(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
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
              className="px-6 flex items-center justify-center bg-white/5 text-white/40 border border-white/5 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5 mr-2" />
              {isPending ? "..." : "Cancel"}
            </button>
          }
          onConfirm={onCancel}
        />
      </div>

      {/* Amount Input Dialog */}
      <Dialog open={showAmountDialog} onOpenChange={setShowAmountDialog}>
        <DialogContent className="p-8 max-w-sm">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              <Wallet className="w-5 h-5 text-green-400" />
              Enter Naira Amount
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Amount in Naira (₦)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-white/40">₦</div>
                <Input
                  type="number"
                  value={amountNaira}
                  onChange={(e) => setAmountNaira(e.target.value)}
                  placeholder="Enter amount"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-green-500/50 focus:border-green-500/50 text-lg font-bold pl-10"
                />
              </div>

              {equivalentUsd && (
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in duration-300">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Equivalent</span>
                  <span className="text-base font-black text-primary">${equivalentUsd}</span>
                </div>
              )}

              {isBelowMin && usdToNgn && (
                <p className="text-[10px] text-red-400 font-bold ml-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Min: ₦{(minTopupUsd * usdToNgn).toLocaleString()} (~${minTopupUsd})
                </p>
              )}
            </div>

            <button
              onClick={handleWhatsAppRedirect}
              disabled={!amountNaira || !!isBelowMin || rateLoading}
              className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4" />
              {rateLoading ? "Loading Rate..." : "Chat on WhatsApp"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingFundingNotice;
