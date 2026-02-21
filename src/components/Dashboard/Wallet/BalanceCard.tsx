import React from 'react';
import { Wallet, ArrowUpRight } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  onTopUp: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, onTopUp }) => {
  return (
    <div className="relative group overflow-hidden rounded-[2rem] border border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent backdrop-blur-3xl p-8 md:p-10 transition-all duration-500 hover:border-green-500/40">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-[60px] -ml-16 -mb-16 opacity-30" />

      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-green-500 shadow-xl shadow-green-500/20 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
            <Wallet className="w-6 h-6 md:w-8 md:h-8 text-white relative z-10" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.2em] truncate">
              Total Available Balance
            </h3>
            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-white/40 text-lg md:text-2xl font-medium font-mono shrink-0">$</span>
              <p className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl leading-none truncate">
                {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex">
          <button
            onClick={onTopUp}
            className="group/btn relative inline-flex items-center justify-center gap-4 bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              Add Funds
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
            </span>
          </button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent" />
    </div>
  );
};

export default BalanceCard;