import React, { useState } from 'react';
import { 
  Copy,
  CheckCircle,
  Bitcoin,
  Coins
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentMethod {
  id: string;
  name: string;
  symbol: string;
  icon: React.ComponentType<{ className?: string }>;
  address: string;
}

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFundsDialog: React.FC<AddFundsDialogProps> = ({ open, onOpenChange }) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('bitcoin');
  const [amount, setAmount] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const paymentMethods: PaymentMethod[] = [
    { 
      id: 'bitcoin', 
      name: 'Bitcoin', 
      symbol: 'BTC', 
      icon: Bitcoin, 
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' 
    },
    { 
      id: 'ethereum', 
      name: 'Ethereum', 
      symbol: 'ETH', 
      icon: Coins, 
      address: '0x742d35Cc6634C0532925a3b8D4B9E4B5B8B8B8B8' 
    },
    { 
      id: 'usdt', 
      name: 'USDT', 
      symbol: 'USDT', 
      icon: Coins, 
      address: '0x123d35Cc6634C0532925a3b8D4B9E4B5B8B8B123' 
    }
  ];

  const selectedOption = paymentMethods.find(option => option.id === selectedMethod);

  const copyAddress = (): void => {
    if (selectedOption) {
      navigator.clipboard.writeText(selectedOption.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add Funds</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Amount (USD)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-white/60 text-sm mb-2">Payment Method</label>
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
                  <span className="text-xs">{method.symbol}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Address */}
          {selectedOption && (
            <div>
              <label className="block text-white/60 text-sm mb-2">Send Payment To</label>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-mono break-all mr-2">
                    {selectedOption.address}
                  </span>
                  <button
                    onClick={copyAddress}
                    className="p-1 text-white/60 hover:text-white transition-colors flex-shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-300/80 text-xs">
              Funds will be added to your wallet after payment confirmation. Minimum: $10
            </p>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFundsDialog;