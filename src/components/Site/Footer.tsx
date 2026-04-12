import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
              <div className="flex items-center gap-2.5 text-xs font-semibold text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                Form Studio Tools
              </div>
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
                { key: 'twitter_link', icon: 'fab fa-twitter' },
                { key: 'instagram_link', icon: 'fab fa-instagram' },
                { key: 'telegram_link', icon: 'fab fa-telegram' },
                { key: 'whatsapp_community_link', icon: 'fab fa-whatsapp' },
                { key: 'tiktok_link', icon: 'fab fa-tiktok' }
              ].map((social) => {
                const link = settings?.[social.key as keyof SiteSettings] as string;
                if (!link) return null;
                return (
                  <li key={social.key}>
                    <a 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label={`SharpToolz on ${social.key.split('_')[0]}`}
                      className="w-12 h-12 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all duration-300 text-lg group"
                    >
                      <i className={`${social.icon} group-hover:scale-110 transition-transform`}></i>
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
