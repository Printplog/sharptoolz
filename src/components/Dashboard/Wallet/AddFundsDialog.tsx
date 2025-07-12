import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, CheckCircle, Loader2, Wallet, Send } from 'lucide-react';
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
  }, [open]);

  useEffect(() => {
    if (mode && !data && !isPending) {
      mutate('bep20/usdt');
    }
  }, [mode]);

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
    const msg = `Hello, I'd like to fund my wallet with $${amount}. Kindly provide payment instructions for USDT BEP20 transfer to:\n${data.payment_address}`;
    const encoded = encodeURIComponent(msg);
    const link = `https://wa.me/${VENDOR_WHATSAPP}?text=${encoded}`;
    window.open(link, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add Funds</DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose method */}
        {!mode && (
          <div className="flex gap-3">
            <button
              onClick={() => setMode('crypto')}
              className="flex-1 bg-white/5 border border-white/10 py-3 px-4 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4 text-primary" />
              <span className="text-sm">Crypto</span>
            </button>
            <button
              onClick={() => setMode('naira')}
              className="flex-1 bg-white/5 border border-white/10 py-3 px-4 rounded-lg hover:bg-white/10 transition flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-sm">Naira</span>
            </button>
          </div>
        )}

        {/* Step 2: Crypto Mode */}
        {mode === 'crypto' && (
          <>
            {isPending ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            ) : data?.payment_address ? (
              <div className="space-y-4">
                <div className="text-sm">Send payment to the address below:</div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-mono break-all">{data.payment_address}</span>
                  <button
                    onClick={handleCopy}
                    className="text-white/60 hover:text-white ml-2"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs p-3 rounded-lg">
                  ⚠️ Only send USDT via BEP20 network to avoid loss of funds.
                </div>

                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition"
                >
                  Got it
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Step 2: Naira Mode */}
        {mode === 'naira' && (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Enter Amount ($)</label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              {isPending ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              ) : (
                data?.payment_address && (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-white/60 mb-1">Crypto Address (Auto Filled)</div>
                      <div className="text-sm font-mono break-all">{data.payment_address}</div>
                    </div>

                    <button
                      onClick={handleNairaRedirect}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-500 transition"
                    >
                      Continue to pay
                    </button>
                  </>
                )
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
