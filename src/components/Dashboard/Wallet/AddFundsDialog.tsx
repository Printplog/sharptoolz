import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { CryptoPaymentData } from '@/types';

import {
  Copy,
  CheckCircle,
  Coins,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createCryptoPayment } from '@/api/apiEndpoints';
import errorMessage from '@/lib/utils/errorMessage';

interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  icon: React.ComponentType<{ className?: string }>;
  ticker: string;
  network: string;
}

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFundsDialog: React.FC<AddFundsDialogProps> = ({ open, onOpenChange }) => {
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'usdt',
      name: 'USDT (BEP20)',
      symbol: 'USDT',
      icon: Coins,
      ticker: 'bep20/usdt',
      network: 'BEP20 (Binance Smart Chain)',
    },
  ];

  const {
    mutate,
    data,
    isPending,
  } = useMutation<CryptoPaymentData, Error, string>({
    mutationFn: createCryptoPayment,
    onError: (error: Error) => {
      toast.error(errorMessage(error));
      onOpenChange(false);
    },
  });

  // Auto trigger if only one method
  useEffect(() => {
    if (open && paymentMethods.length === 1) {
      const only = paymentMethods[0];
      setSelectedMethod(only.id);
      mutate(only.ticker);
    }
  }, [open]);

  // Trigger mutation on manual selection
  useEffect(() => {
    if (selectedMethod && paymentMethods.length > 1) {
      const method = paymentMethods.find(m => m.id === selectedMethod);
      if (method) mutate(method.ticker);
    }
  }, [selectedMethod]);

  const selectedOption = paymentMethods.find(m => m.id === selectedMethod);

  const copyAddress = () => {
    if (data?.payment_address) {
      navigator.clipboard.writeText(data.payment_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Address copied to clipboard');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add Funds</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Select method if multiple */}
          {paymentMethods.length > 1 && !data && (
            <div>
              <label className="block text-white/60 text-sm mb-2">Choose Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <method.icon className="w-5 h-5" />
                    <div className="text-center">
                      <div className="text-xs font-medium">{method.symbol}</div>
                      <div className="text-[10px] text-white/40">{method.ticker}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPending && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}

          {data?.payment_address && !isPending && selectedOption && (
            <div className="space-y-4">
              {/* Network Information */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-amber-300 font-medium text-sm mb-1">
                      Network: {selectedOption.network}
                    </h4>
                    <p className="text-amber-200/80 text-xs">
                      <strong>IMPORTANT:</strong> Send only {selectedOption.symbol} tokens using the <strong>{selectedOption.network}</strong> network. 
                      Sending from any other network or token type will result in permanent loss of funds and payment cannot be confirmed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-white/60 text-sm mb-2">
                    Payment Details
                  </label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs">Token:</span>
                      <span className="text-white text-sm font-medium">{selectedOption.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs">Network:</span>
                      <span className="text-white text-sm font-medium">{selectedOption.network}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-xs">Ticker:</span>
                      <span className="text-white text-sm font-mono">{selectedOption.ticker}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-2">Send Payment To</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-mono break-all mr-2">
                        {data.payment_address}
                      </span>
                      <button
                        onClick={copyAddress}
                        className="p-1 text-white/60 hover:text-white transition-colors flex-shrink-0"
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
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-blue-300/80 text-xs">
                  Send <strong>any amount</strong> to the address above using the <strong>{selectedOption.network}</strong> network. 
                  It will be credited to your wallet after network confirmation.
                </p>
              </div>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFundsDialog;