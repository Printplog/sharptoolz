import { motion } from "framer-motion";
import { Mail, Send, Bell, ShieldCheck, Twitter, Instagram, MessageCircle, Music2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";

export default function ContactInfo() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  const socialPlatforms = [
    { 
      id: "telegram",
      key: "telegram_link",
      title: "Telegram Community",
      icon: Send,
      label: "Official Channel",
      color: "text-[#0088cc]"
    },
    { 
      id: "twitter",
      key: "twitter_link",
      title: "Twitter (X)",
      icon: Twitter,
      label: "Latest News",
      color: "text-white"
    },
    { 
      id: "instagram",
      key: "instagram_link",
      title: "Instagram",
      icon: Instagram,
      label: "Visual Updates",
      color: "text-[#E1306C]"
    },
    { 
      id: "whatsapp",
      key: "whatsapp_community_link",
      title: "WhatsApp Hub",
      icon: MessageCircle,
      label: "Direct Community",
      color: "text-[#25D366]"
    },
    { 
      id: "tiktok",
      key: "tiktok_link",
      title: "TikTok",
      icon: Music2,
      label: "Tool Hacks",
      color: "text-[#00f2ea]"
    }
  ];

  const activeSocials = socialPlatforms.filter(p => settings?.[p.key as keyof SiteSettings]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
        {/* Support Email Card */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="group relative bg-[#1A1F26] backdrop-blur-3xl border border-white/10 hover:border-primary/40 rounded-3xl p-8 transition-all duration-500 overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20" />
          <div className="flex items-start gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500">
              <Mail className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Official Support</span>
              </div>
              <h4 className="text-white font-black text-xs uppercase tracking-wider mb-1">Email Support</h4>
              <p className="text-white/70 text-sm font-medium truncate italic tracking-tight">support@sharptoolz.com</p>
            </div>
          </div>
        </motion.div>

        {activeSocials.map((platform, index) => {
          const Icon = platform.icon;
          const href = settings?.[platform.key as keyof SiteSettings] as string;
          
          return (
            <motion.a
              key={platform.id}
              href={href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.1 }}
              className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all duration-500 overflow-hidden"
            >
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-all">
                  <Icon className={`w-5 h-5 ${platform.color} opacity-100 transition-all`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.1em]">{platform.label}</span>
                  </div>
                  <h4 className="text-white/60 font-bold text-[11px] group-hover:text-white transition-colors">{platform.title}</h4>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* Trust Baseline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-primary/5 border border-primary/10 rounded-3xl p-8 space-y-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-4">
           <ShieldCheck className="w-5 h-5 text-primary" />
           <div>
             <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">Secure Communications</p>
             <p className="text-white/30 text-[10px] font-medium leading-relaxed">
               All inquiries are handled in strict confidence by our executive support team.
             </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
