import { Users, TrendingUp, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import type { ReferralStats as ReferralStatsType } from "@/api/referralEndpoints";

interface Props {
  stats: ReferralStatsType | undefined;
  isLoading: boolean;
}

export default function ReferralStats({ stats, isLoading }: Props) {
  const cards = [
    {
      label: "Referrals",
      value: stats?.total_referrals ?? 0,
      icon: Users,
      color: "from-cyan-500/20 to-cyan-600/5",
      accent: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    {
      label: "Rewarded",
      value: stats?.rewarded_referrals ?? 0,
      icon: TrendingUp,
      color: "from-emerald-500/20 to-emerald-600/5",
      accent: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    {
      label: "Earned",
      value: `$${stats?.total_earned ?? "0.00"}`,
      icon: DollarSign,
      color: "from-violet-500/20 to-violet-600/5",
      accent: "text-violet-400",
      border: "border-violet-500/20",
    },
    {
      label: "Withdrawable",
      value: `$${stats?.withdrawable_balance ?? "0.00"}`,
      icon: DollarSign,
      color: "from-amber-500/20 to-amber-600/5",
      accent: "text-amber-400",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative overflow-hidden rounded-3xl border ${card.border} bg-gradient-to-br ${card.color} p-6 h-full`}
        >
          <div className="flex justify-between h-full">
            <div className="flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
                {card.label}
              </p>
              <div>
                {isLoading ? (
                  <div className="h-8 w-16 bg-white/5 animate-pulse rounded-md mt-1" />
                ) : (
                  <h3 className="text-4xl font-black tracking-tighter italic text-white uppercase leading-none">
                    {card.value}
                  </h3>
                )}
              </div>
            </div>
            <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 ${card.accent} self-start`}>
              <card.icon className="w-5 h-5" />
            </div>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute -right-4 -bottom-4 opacity-5">
            <card.icon className="w-24 h-24 rotate-12" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
