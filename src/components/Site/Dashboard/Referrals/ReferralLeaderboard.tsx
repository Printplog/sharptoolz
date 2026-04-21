import { Trophy, Medal, Crown } from "lucide-react";
import { motion } from "framer-motion";
import type { LeaderboardEntry } from "@/api/referralEndpoints";

interface Props {
  entries: LeaderboardEntry[] | undefined;
  isLoading: boolean;
}

export default function ReferralLeaderboard({ entries, isLoading }: Props) {
  const getBadgeIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-4 h-4 text-yellow-400" />;
      case 1: return <Medal className="w-4 h-4 text-gray-300" />;
      case 2: return <Medal className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          <Trophy className="w-5 h-5" />
        </div>
        <h3 className="text-base font-black tracking-tight text-white">Global Leaderboard</h3>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-2xl" />
          ))
        ) : !entries || entries.length === 0 ? (
          <div className="text-center py-6 text-white/20 text-xs italic">
            Be the first to reach the top!
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.username}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-3 rounded-2xl border border-white/5 transition-all group/item ${
                index === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-black/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  index === 0 ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-black uppercase tracking-tight italic ${
                      index === 0 ? 'text-yellow-500' : 'text-white'
                    }`}>
                      {entry.username}
                    </p>
                    {getBadgeIcon(index)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-widest text-white/20 mb-px">Earnings</p>
                <p className={`text-sm font-black tracking-tighter italic ${
                  index === 0 ? 'text-yellow-500' : 'text-white/60'
                }`}>
                  ${Number(entry.amount).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <p className="text-[9px] text-center font-black tracking-[0.2em] text-white/10 italic">
          Leaderboard updates every 1 hour
        </p>
      </div>
    </div>
  );
}
