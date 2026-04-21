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
  CircleDollarSign
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
    transition={{ delay: index * 0.1 }}
    className="relative p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:border-primary/20 transition-all group overflow-hidden"
  >
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-all" />
    
    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    
    <h4 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
      {title}
    </h4>
    <p className="text-white/40 text-sm font-medium leading-relaxed">
      {description}
    </p>
  </motion.div>
);

export default function ReferralAnnouncement() {
  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings
  });

  const [calcAmount, setCalcAmount] = useState<string>("100");
  
  const percentage = useMemo(() => {
    return parseFloat(settings?.referral_percentage || "10");
  }, [settings]);

  const potentialEarning = useMemo(() => {
    const amount = parseFloat(calcAmount) || 0;
    return (amount * (percentage / 100)).toFixed(2);
  }, [calcAmount, percentage]);

  if (settings?.enable_referrals === false) return null;

  return (
    <SectionPadding id="referral-program" className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 flex items-center gap-2 mb-6"
          >
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black tracking-widest text-primary uppercase">Affiliate Program Live</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic text-white leading-[0.9]">
            Earn for <span className="text-primary">Life</span>.<br/>
            Join Our Network.
          </h2>
          <p className="mt-6 text-white/40 max-w-2xl font-medium text-base md:text-lg leading-relaxed">
            Invite your friends to SharpToolz and earn a <span className="text-white font-bold">{percentage}% lifetime commission</span> on every deposit they make. No limits, no hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Step 
            icon={Users}
            title="1. Join"
            description="Create an account and get your unique referral link immediately."
            index={0}
          />
          <Step 
            icon={TrendingUp}
            title="2. Invite"
            description="Share your link with your network on social media or directly."
            index={1}
          />
          <Step 
            icon={CircleDollarSign}
            title="3. Earn"
            description={`Get ${percentage}% of every deposit your friends make, credited instantly.`}
            index={2}
          />
        </div>

        {/* Calculator Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 p-8 md:p-12 mb-16"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-3xl rounded-full" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight">Reward Calculator</h3>
              </div>
              <p className="text-white/40 font-medium mb-8">
                Estimated earnings based on your friend's deposit amount. Remember, you earn this on <span className="text-primary italic">every</span> deposit they make.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 block">
                    Expected Friend Deposit ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</span>
                    <input 
                      type="number"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-5 text-white font-bold focus:outline-none focus:border-primary/50 transition-colors text-xl"
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-primary/5 border border-primary/10 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700" />
              
              <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">You Record</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-7xl font-black text-white tracking-tighter italic">${potentialEarning}</span>
                <span className="text-xl font-bold text-white/20 italic">USD</span>
              </div>
              <div className="mt-4 flex items-center gap-2 px-4 py-1 bg-primary/10 rounded-full border border-primary/20">
                <Percent className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{percentage}% Commission</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-center">
            <PremiumButton 
                text="Start Earning Now" 
                icon={ArrowRight} 
                href="/auth/register" 
                variant="primary" 
            />
        </div>
      </div>
    </SectionPadding>
  );
}
