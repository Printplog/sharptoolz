import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import SectionPadding from "@/layouts/SectionPadding";
import { 
  Gift, 
  Users, 
  TrendingUp, 
  ArrowRight, 
  Calculator,
  Percent,
  CircleDollarSign,
  ChevronRight
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";

interface StepProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const Step = ({ icon: Icon, title, description, index }: StepProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.2 }}
    className="relative p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 hover:border-primary/40 transition-all group z-10"
  >
    {/* Internal Gloss */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
    
    <div className="relative z-20">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(206,232,140,0.1)]">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      
      <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-3 flex items-center gap-2">
        <span className="text-primary/20 not-italic text-sm">0{index + 1}</span>
        {title}
      </h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed">
        {description}
      </p>
    </div>

    {/* Pulse signal indicator */}
    <div className="absolute -inset-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] -z-10" />
  </motion.div>
);

export default function ReferralAnnouncement() {
  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings
  });

  const [numFriends, setNumFriends] = useState<string>("10");
  const [avgDeposit, setAvgDeposit] = useState<string>("50");
  
  const percentage = useMemo(() => {
    return parseFloat(settings?.referral_percentage || "10");
  }, [settings]);

  const potentialEarning = useMemo(() => {
    const friends = parseFloat(numFriends) || 0;
    const deposit = parseFloat(avgDeposit) || 0;
    return (friends * deposit * (percentage / 100)).toFixed(2);
  }, [numFriends, avgDeposit, percentage]);

  if (settings?.enable_referrals === false) return null;

  return (
    <SectionPadding id="referral-program" className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2 mb-8"
          >
            <div className="relative">
                <Gift className="w-4 h-4 text-primary" />
                <span className="absolute inset-0 bg-primary/40 blur-sm animate-pulse rounded-full" />
            </div>
            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Revenue Share Active</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-[0.85] mb-6">
            Build Your <span className="text-primary">Empire</span>.<br/>
            earn lifetime pay.
          </h2>
          <p className="text-white/40 max-w-2xl font-medium text-base md:text-lg leading-relaxed">
            Invite friends and create a passive income stream. Gain <span className="text-white font-bold">{percentage}%</span> of every transaction your network makes, forever.
          </p>
        </div>

        {/* Steps with Pulse Animation */}
        <div className="relative mb-24 px-4">
          {/* Connecting Line with Signal */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 hidden md:block">
            <motion.div 
              initial={{ left: "-10%" }}
              animate={{ left: "110%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 -translate-y-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
              style={{ boxShadow: "0 0 20px rgba(206,232,140,0.5)" }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <Step 
              icon={Users}
              title="Registration"
              description="Sign up and access your dedicated affiliate dashboard and tracking tools."
              index={0}
            />
            <Step 
              icon={TrendingUp}
              title="Propagation"
              description="Deploy your links across your network using our pre-built high-converting assets."
              index={1}
            />
            <Step 
              icon={CircleDollarSign}
              title="Accumulation"
              description={`Harvest your ${percentage}% commissions in real-time as your network thrives.`}
              index={2}
            />
          </div>
        </div>

        {/* Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[3rem] bg-[#070707] border border-white/5 p-8 md:p-16"
        >
          {/* Glowing Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                <div className="max-w-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/20 transition-colors">
                            <Calculator className="w-6 h-6 text-white/60" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">Earnings Calculator</h3>
                    </div>
                    <p className="text-white/40 font-medium text-base">
                        Simulate your potential monthly revenue based on your referral network activity.
                    </p>
                </div>
                
                <div className="flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-2">Estimated Earnings</span>
                    <div className="flex items-baseline gap-3">
                        <span className="text-6xl md:text-8xl font-black text-primary tracking-tighter italic drop-shadow-[0_0_30px_rgba(206,232,140,0.2)]">
                            ${potentialEarning}
                        </span>
                        <span className="text-2xl font-bold text-white/10 uppercase italic">/ cycle</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-10 bg-white/[0.02] border border-white/5 p-8 md:p-12 rounded-[2.5rem]">
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[11px] font-black text-white/60 uppercase tracking-widest">
                       Active Referrals
                    </label>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-white font-black text-xs">{numFriends} users</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="100"
                    value={numFriends}
                    onChange={(e) => setNumFriends(e.target.value)}
                    className="w-full accent-primary bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-white/20 mt-2">
                    <span>1 USER</span>
                    <span>100 USERS</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-white/60 uppercase tracking-widest">
                       Average User Deposit
                    </label>
                    <span className="text-primary font-black text-sm">${avgDeposit}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</span>
                    <input 
                      type="number"
                      value={avgDeposit}
                      onChange={(e) => setAvgDeposit(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl pl-12 pr-6 py-6 text-white font-black focus:outline-none focus:border-primary/50 transition-all text-2xl shadow-inner"
                      placeholder="Amount"
                    />
                  </div>
                </div>
              </div>

              <div className="h-full flex flex-col gap-6">
                <div className="flex-1 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative group">
                    <div className="absolute top-6 right-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp className="w-12 h-12 text-primary" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-4">How it works</h4>
                    <ul className="space-y-4">
                        {[
                            `You get ${percentage}% of every deposit.`,
                            "Withdrawals processed in 24-48 hours.",
                            "Direct USDT BEP20 payouts.",
                            "Lifetime cookie tracking for referrals."
                        ].map((text, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm font-medium text-white/50">
                                <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                                {text}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex items-center gap-4">
                    <PremiumButton 
                        text="Join Network" 
                        icon={ArrowRight} 
                        href="/auth/register" 
                        variant="primary" 
                        className="flex-1 py-6"
                    />
                    <button className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group">
                        <Users className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionPadding>
  );
}
