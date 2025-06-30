import React from 'react';
import { Wallet } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  onTopUp: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, onTopUp }) => {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-white/60 text-sm">Available Balance</h3>
            <p className="text-3xl font-bold text-white">${balance.toFixed(2)}</p>
          </div>
        </div>
        <button 
          onClick={onTopUp}
          className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors text-sm"
        >
          Top Up
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;