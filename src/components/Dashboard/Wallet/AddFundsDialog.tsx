import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, CheckCircle, Loader2, Wallet, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { createCryptoPayment } from '@/api/apiEndpoints';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import type { CryptoPaymentData } from '@/types';
import errorMessage from '@/lib/utils/errorMessage';

const VENDOR_WHATSAPP = '2349160914217';

export default function AddFundsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<'crypto' | 'naira' | null>(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');

  const {
    mutate,
    data,
    isPending,
    reset,
  } = useMutation<CryptoPaymentData, Error, string>({
    mutationFn: createCryptoPayment,
    onError: (error) => {
      toast.error(errorMessage(error));
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      setMode(null);
      setAmount('');
      setCopied(false);
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (mode && !data && !isPending) {
      mutate('bep20/usdt');
    }
  }, [mode, data, isPending, mutate]);

  const handleCopy = () => {
    if (!data?.payment_address) return;
    navigator.clipboard.writeText(data.payment_address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNairaRedirect = () => {
    if (!amount || !data?.payment_address) {
      toast.error('Enter amount and wait for address');
      return;
    }
    // Specific format requested by user
    const msg = `Hello. I want to buy ${amount} BNB. Send the BNB to this Binance Smart Chain wallet address: ${data.payment_address}`;
    const encoded = encodeURIComponent(msg);
    const link = `https://wa.me/${VENDOR_WHATSAPP}?text=${encoded}`;
    window.open(link, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white rounded-[2rem] p-8 max-w-md overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[80px] -z-10" />

        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase italic">
            Add Funds
          </DialogTitle>
          <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">Select your payment method</p>
        </DialogHeader>

        {/* Step 1: Choose method */}
        {!mode && (
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setMode('crypto')}
              className="group relative flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-primary/50 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Send className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-white">Direct Crypto</span>
                  <span className="text-xs text-white/40 uppercase font-black tracking-widest">USDT BEP20</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <CheckCircle className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setMode('naira')}
              className="group relative flex items-center justify-between bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 hover:border-green-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold text-white">Pay with Naira</span>
                  <span className="text-xs text-white/40 uppercase font-black tracking-widest">WhatsApp Vendor</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Crypto Mode */}
        {mode === 'crypto' && (
          <div className="space-y-6">
            {isPending ? (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-white/40">Generating Address...</span>
              </div>
            ) : data?.payment_address ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">USDT BEP20 Address</label>
                  <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
                    <span className="text-sm font-mono break-all text-white/80 pr-4">{data.payment_address}</span>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-primary transition-all"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs uppercase font-bold tracking-tight p-4 rounded-xl flex gap-3 italic">
                  <span className="text-lg">⚠️</span>
                  <span>Only send USDT via BEP20 network to avoid permanent loss of funds.</span>
                </div>

                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-white/5"
                >
                  Close & Proceed
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Step 2: Naira Mode */}
        {mode === 'naira' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Amount to buy (BNB)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 0.0151"
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-green-500/50 focus:border-green-500/50"
                />
              </div>

              {isPending ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-green-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-white/40">Preparing Payment...</span>
                </div>
              ) : (
                data?.payment_address && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-white/40 ml-1">Assigned BSC Address</label>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="text-sm font-mono break-all text-white/60">{data.payment_address}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleNairaRedirect}
                      className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-green-500/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Chat with Vendor
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
