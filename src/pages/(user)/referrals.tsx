import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getReferralStats, 
  getReferralHistory, 
  getLeaderboard,
  requestWithdrawal,
  remindFriends
} from "@/api/referralEndpoints";
import ReferralStats from "@/components/Site/Dashboard/Referrals/ReferralStats";
import ReferralLink from "@/components/Site/Dashboard/Referrals/ReferralLink";
import ReferralHistory from "@/components/Site/Dashboard/Referrals/ReferralHistory";
import ReferralLeaderboard from "@/components/Site/Dashboard/Referrals/ReferralLeaderboard";
import { Gift, Sparkles, ArrowRight, Copy, Check, Wallet, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

function WithdrawalModal({ 
  isOpen, 
  onClose, 
  balance, 
  minWithdrawal 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  balance: string; 
  minWithdrawal: string;
}) {
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: requestWithdrawal,
    onSuccess: (data) => {
      toast.success(data.detail);
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to submit request");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address) return toast.error("Please fill all fields");
    mutation.mutate({ amount: parseFloat(amount), usdt_address: address });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
        >
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Withdraw Earnings</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Manual Payout (USDT BEP20)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end mb-1">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Amount (USD)</label>
                <span className="text-[10px] font-bold text-primary italic">Available: ${balance}</span>
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: $${minWithdrawal}`}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">USDT BEP20 Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] primary-glow hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
            </button>
            
            <p className="text-center text-[9px] text-white/20 font-medium leading-relaxed">
              Payouts are processed manually within 24-48 hours. Please ensure your USDT BEP20 address is correct.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function ReferralsPage() {
  const [copiedHero, setCopiedHero] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referralStats"],
    queryFn: getReferralStats,
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["referralHistory"],
    queryFn: getReferralHistory,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ["referralLeaderboard"],
    queryFn: getLeaderboard,
  });

  const remindMutation = useMutation({
    mutationFn: remindFriends,
    onSuccess: (data) => {
      toast.success(data.detail);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to send reminders");
    }
  });

  return (
    <div className="dashboard-content space-y-8 pb-10">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-primary/20 p-8 md:p-12 group">
        {/* Animated Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full group-hover:bg-primary/30 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black tracking-widest text-primary">Sharp Rewards</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-[0.9]">
            Invite Friends.<br/>
            <span className="text-primary italic">Earn Together.</span>
          </h1>
          <p className="mt-6 text-white/40 max-w-md font-medium text-sm leading-relaxed">
            Boost your balance by inviting friends to SharpToolz. Get rewarded for every successful connection you make.
          </p>
          
          <div className="flex items-center gap-3 mt-8">
            <button 
              onClick={() => document.getElementById('leaderboard-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 bg-primary text-background rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 primary-glow group/btn"
            >
              <span>Leaderboard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 backdrop-blur-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span>Withdraw</span>
            </button>

            <button 
              onClick={() => {
                if (stats?.referral_link) {
                  navigator.clipboard.writeText(stats.referral_link);
                  setCopiedHero(true);
                  toast.success("Referral link copied!");
                  setTimeout(() => setCopiedHero(false), 2000);
                }
              }}
              className="w-10 h-10 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm group/btn"
              title="Copy referral link"
            >
              {copiedHero ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-white/40 group-hover:text-white" />}
            </button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <Gift className="absolute -right-10 -bottom-10 w-64 h-64 text-white/[0.02] -rotate-12 transition-transform group-hover:rotate-0 duration-700" />
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        balance={stats?.withdrawable_balance ?? "0.00"}
        minWithdrawal={stats?.min_withdrawal ?? "10.00"}
      />

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <ReferralStats stats={stats} isLoading={statsLoading} />
          
          {/* Pending Referrals Information Banner */}
          {stats && stats.pending_referrals > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden p-6 rounded-[2rem] bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 group"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-black uppercase italic tracking-tight text-lg leading-none">
                    You have <span className="text-amber-400">{stats.pending_referrals} pending</span> {stats.pending_referrals === 1 ? 'referral' : 'referrals'}!
                  </h4>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                    Remind them to deposit so you both earn a 10% cash bonus.
                  </p>
                </div>
                <button 
                  onClick={() => remindMutation.mutate()}
                  disabled={remindMutation.isPending}
                  className="px-6 py-2.5 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center gap-2"
                >
                  {remindMutation.isPending ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    "Remind Friends"
                  )}
                </button>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Gift className="w-24 h-24 rotate-12" />
              </div>
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ReferralHistory referrals={history} isLoading={historyLoading} />
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ReferralLink link={stats?.referral_link} isLoading={statsLoading} />
          </motion.div>
          
          <motion.div
            id="leaderboard-section"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ReferralLeaderboard entries={leaderboard} isLoading={leaderboardLoading} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
