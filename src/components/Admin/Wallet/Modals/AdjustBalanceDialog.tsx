import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface UserWallet {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  balance: number;
  status: 'active' | 'blocked';
}

interface AdjustBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: UserWallet | null;
  onSubmit: (walletId: string, type: 'credit' | 'debit', amount: number, reason: string) => void;
}

export default function AdjustBalanceDialog({
  open,
  onOpenChange,
  wallet,
  onSubmit,
}: AdjustBalanceDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!wallet || !amount) return;

    onSubmit(wallet.id, adjustmentType, parseFloat(amount), reason);
    setAmount('');
    setReason('');
    onOpenChange(false);
  };

  const newBalance = wallet && amount ?
    adjustmentType === 'credit'
      ? wallet.balance + parseFloat(amount)
      : wallet.balance - parseFloat(amount)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Adjust Wallet Balance</DialogTitle>
          <DialogDescription className="text-white/40">
            Manually adjust user wallet balance
          </DialogDescription>
        </DialogHeader>

        {wallet && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/40">User</span>
                <span className="font-semibold text-white">{wallet.user.username}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/40">Email</span>
                <span className="text-white">{wallet.user.email}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm text-white/40">Current Balance</span>
                <span className="font-bold text-green-400">
                  ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Adjustment Type */}
            <div className="space-y-3">
              <Label className="text-white/80">Adjustment Type</Label>
              <RadioGroup
                value={adjustmentType}
                onValueChange={(v) => setAdjustmentType(v as 'credit' | 'debit')}
                className="grid grid-cols-2 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="credit"
                    id="credit"
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="credit"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:bg-green-500/20 peer-data-[state=checked]:border-green-500/50 peer-data-[state=checked]:text-green-400 transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">Credit (Add)</span>
                  </label>
                </div>
                <div className="relative">
                  <RadioGroupItem
                    value="debit"
                    id="debit"
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="debit"
                    className="flex items-center justify-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer peer-data-[state=checked]:bg-red-500/20 peer-data-[state=checked]:border-red-500/50 peer-data-[state=checked]:text-red-400 transition-all"
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold">Debit (Remove)</span>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-white/80">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label className="text-white/80">Reason</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Manual adjustment by admin..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                rows={3}
              />
            </div>

            {/* New Balance Preview */}
            {newBalance !== null && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">New Balance</span>
                  <span className={`font-bold ${newBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || !reason}
            className={
              adjustmentType === 'credit'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {adjustmentType === 'credit' ? 'Add Funds' : 'Remove Funds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
