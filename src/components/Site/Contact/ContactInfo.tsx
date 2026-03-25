import { motion } from "framer-motion";
import { Mail, Send, Bell, ShieldCheck } from "lucide-react";

export default function ContactInfo() {
  const infoCards = [
    {
      title: "Email Support",
      value: "contact@sharptoolz.com",
      icon: Mail,
      label: "Support Email",
    },
    {
      title: "Telegram Community",
      value: "@sharptoolz_hub",
      icon: Send,
      label: "Join us",
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
        {infoCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative bg-white/[0.03] backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-3xl p-8 transition-all duration-300 overflow-hidden shadow-lg`}
          >
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-linear-to-tr from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all duration-500">
                <card.icon className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{card.label}</span>
                  <div className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-primary/40 transition-colors" />
                </div>
                <h4 className="text-white font-black text-xs uppercase tracking-wider mb-1">{card.title}</h4>
                <p className="text-white/70 text-sm font-medium truncate">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Baseline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/2 backdrop-blur-md border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10">
           <Bell className="w-4 h-4 text-white/30" />
           <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
             Quick & Reliable Support
           </p>
        </div>
        
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-3 h-3 text-primary/40" />
             <span className="text-[10px] font-medium text-white/50">Your messages are safe and private</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
