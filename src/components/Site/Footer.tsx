import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Twitter, Instagram, Send, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import Logo from "../Logo";
import SectionPadding from "@/layouts/SectionPadding";

export default function Footer() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  return (
    <div>
      <footer className="bg-[#0A0D11]/95 backdrop-blur-3xl border-t border-white/10 rounded-t-[48px] overflow-hidden">
        <SectionPadding className="py-24 grid grid-cols-1 md:grid-cols-4 gap-16 border-none">
          {/* Brand Section */}
          <div className="space-y-8">
            <Logo noLink={true} size={42} />
            <div className="space-y-6">
              <p className="text-sm text-white/50 leading-relaxed max-w-[260px]">
                The next-generation platform for rapid document generation. 
                Build and automate high-fidelity templates in seconds.
              </p>
            </div>
          </div>

          {/* Directory */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Directory</h4>
            <ul className="space-y-4 text-sm text-white/60 font-medium">
              <li>
                <Link to="/" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Home</Link>
              </li>
              <li>
                <Link to="/all-tools" className="hover:text-primary transition-all hover:translate-x-1 inline-block">All Tools</Link>
              </li>
              <li>
                <Link to="/tutorials" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Tutorials</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-all hover:translate-x-1 inline-block">Contact Support</Link>
              </li>
              <li>
                 <a 
                   href={settings?.whatsapp_community_link || "#"} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-primary/70 hover:text-primary transition-all font-bold flex items-center gap-2"
                 >
                   Community Hub
                 </a>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Social Feed</h4>
            <ul className="grid grid-cols-3 gap-4">
              {[
                { key: 'twitter_link', icon: <Twitter className="w-5 h-5" />, label: "Twitter" },
                { key: 'instagram_link', icon: <Instagram className="w-5 h-5" />, label: "Instagram" },
                { key: 'telegram_link', icon: <Send className="w-5 h-5" />, label: "Telegram" },
                { key: 'whatsapp_community_link', icon: <MessageCircle className="w-5 h-5" />, label: "WhatsApp" },
                { 
                  key: 'tiktok_link', 
                  icon: (
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  ), 
                  label: "TikTok" 
                }
              ].map((platform) => {
                const link = settings?.[platform.key as keyof SiteSettings] as string;
                if (!link) return null;
                
                return (
                  <li key={platform.key}>
                    <a 
                      href={link || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label={`SharpToolz on ${platform.label}`}
                      className="w-12 h-12 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-300 text-lg group"
                    >
                      <div className="group-hover:scale-110 transition-transform">
                        {platform.icon}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Legal / System Status */}
          <div className="space-y-8">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Governance</h4>
            <ul className="space-y-4 text-sm text-white/60 font-medium">
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
              </li>
            </ul>
          </div>
        </SectionPadding>

        {/* Global Footer Baseline */}
        <SectionPadding className="border-t border-white/5 py-12 bg-black/20 border-none!">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[11px] font-medium text-white/30">
            <p>© {new Date().getFullYear()} SharpToolz Systems. Effortless Automation.</p>
            <div className="flex items-center gap-10">
               <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/5" />
                  <span className="text-white/20">Secure & Stateless</span>
               </div>
            </div>
          </div>
        </SectionPadding>
      </footer>
    </div>
  );
}
