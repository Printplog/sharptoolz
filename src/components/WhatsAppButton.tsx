import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import { useLocation } from "react-router-dom";
import type { SiteSettings } from "@/types";
import { cn } from "@/lib/utils";
import { 
  X, 
  Headset,
  Send, 
  Twitter,
  Instagram,
  Bell
} from "lucide-react";

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("w-5 h-5 fill-current", className)} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={cn("w-6 h-6", className)} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      fill="white"
      d="M12.525.02c1.31-.32 2.51.85 2.51 2.1l-.01 6.31c1.33-1.25 3.03-1.6 4.79-1.03l.01 2.92a4.99 4.99 0 0 0-3.32.33l-.01 7.82c0 3.1-2.52 5.62-5.63 5.62-3.11 0-5.63-2.52-5.63-5.63 0-3.1 2.52-5.62 5.63-5.62l.01 3.01c-1.45 0-2.62 1.17-2.62 2.62s1.17 2.62 2.62 2.62c1.45 0 2.63-1.17 2.63-2.62l.01-18.15Z"
    />
  </svg>
);

const containerVariants: Variants = {
  open: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1
    }
  },
  closed: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: 1
    }
  }
};

const itemVariants: Variants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  closed: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

export default function WhatsAppButton() {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAnnouncementCard, setShowAnnouncementCard] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  // Check if we are in a dashboard or admin route that has a bottom bar on mobile
  const dashboardRoutes = ["/dashboard", "/tools", "/documents", "/wallet", "/settings", "/sharp-guy", "/all-tools"];
  const isDashboardOrAdmin = 
    dashboardRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`)) || 
    pathname.startsWith("/admin");

  // Construct links from settings
  const actions: ActionItem[] = [
    {
      id: "whatsapp",
      label: "Customer Care",
      icon: <Headset size={20} />,
      href: settings?.whatsapp_number 
        ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`
        : `https://wa.me/2348147929994`,
      color: "bg-[#25D366]",
      show: settings?.show_whatsapp_on_hover ?? true
    },
    {
      id: "community",
      label: "WhatsApp Community",
      icon: <WhatsAppIcon />,
      href: settings?.whatsapp_community_link || "#",
      color: "bg-[#128C7E]",
      show: settings?.show_community_on_hover ?? true
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: <Send size={20} />,
      href: settings?.telegram_link || "#",
      color: "bg-[#0088cc]",
      show: settings?.show_telegram_on_hover ?? true
    },
    {
      id: "instagram",
      label: "Instagram",
      icon: <Instagram size={20} />,
      href: settings?.instagram_link || "#",
      color: "bg-radial-[at_30%_107%] from-[#fdf497] via-[#fdf497] to-[#d6249f] shadow-lg",
      show: settings?.show_instagram_on_hover ?? true
    },
    {
      id: "twitter",
      label: "Twitter (X)",
      icon: <Twitter size={20} />,
      href: settings?.twitter_link || "#",
      color: "bg-black",
      show: settings?.show_twitter_on_hover ?? true
    },
    {
      id: "tiktok",
      label: "TikTok",
      icon: <TikTokIcon />,
      href: settings?.tiktok_link || "#",
      color: "bg-black border border-white/10",
      show: settings?.show_tiktok_on_hover ?? true
    },
  ].filter(action => action.href !== "#" && (action.show ?? true));

  return (
    <div 
      className={cn(
        "fixed right-6 z-60 transition-all duration-300 pointer-events-none",
        isDashboardOrAdmin 
          ? "bottom-22 lg:bottom-10" 
          : "bottom-10"
      )}
    >
      <div className="relative flex flex-col items-center">
        {/* Floating Menu Items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={containerVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col items-center gap-4 mb-4"
            >
              {actions.map((action) => (
                <motion.div
                  key={action.id}
                  variants={itemVariants}
                  className="pointer-events-auto group relative flex items-center"
                >
                  {/* Tooltip Label */}
                  <span className="absolute right-16 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest whitespace-nowrap opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-xl">
                    {action.label}
                  </span>

                  <a
                    href={action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 border border-white/20",
                      action.color
                    )}
                  >
                    {action.icon}
                  </a>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Toggler FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "pointer-events-auto h-14 w-14 rounded-full shadow-2xl flex items-center justify-center relative z-10 transition-all active:scale-90",
            isOpen 
              ? "bg-black/80 backdrop-blur-xl border border-white/10 text-white" 
              : "bg-linear-to-br from-[#25D366] to-[#128C7E] text-white"
          )}
          initial={false}
          animate={{ 
            rotate: isOpen ? 90 : 0,
            scale: 1
          }}
          whileHover={{ scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
              >
                <X size={28} />
              </motion.div>
            ) : (
              <motion.div
                key="support"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="relative flex items-center justify-center"
              >
                <Headset size={28} />
                {/* Pulsing effect only when closed */}
                {!isOpen && (
                  <span className="absolute -inset-2 rounded-full bg-primary/20 animate-ping" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* Subtle glow (base) */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl -z-10" />
        )}
      </div>

      {/* Global Announcement Jingle Bell & Floating Card */}
      <AnimatePresence>
        {settings?.enable_global_announcement && settings?.global_announcement_text && !isOpen && (
          <div className={cn(
            "fixed right-8 z-70 flex items-center",
            isDashboardOrAdmin 
              ? "bottom-38 lg:bottom-28" 
              : "bottom-26"
          )}>
            {/* The Floating Announcement Card (Side Tooltip) */}
            <AnimatePresence>
              {showAnnouncementCard && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 20, scale: 0.8, filter: "blur(10px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mr-4 w-72 bg-[#0a0a0a]/90 backdrop-blur-2xl border border-primary/30 rounded-2xl p-5 shadow-[0_20px_50px_rgba(var(--primary),0.2)] relative"
                >
                  <div className="flex flex-col items-center">
                    <p className="text-[13px] text-white/80 text-center leading-relaxed font-medium italic">
                      "{settings.global_announcement_text}"
                    </p>
                    
                    {settings.global_announcement_link && (
                      <a 
                        href={settings.global_announcement_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-all border-b border-primary/40 hover:border-white"
                      >
                        Learn More
                      </a>
                    )}
                  </div>
                  
                  {/* Tooltip Arrow */}
                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0a0a0a] border-r border-t border-primary/30 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => setShowAnnouncementCard(!showAnnouncementCard)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: showAnnouncementCard ? 1 : [1, 1.15, 1], 
                rotate: showAnnouncementCard ? 90 : [0, -20, 20, -20, 20, -20, 0],
                opacity: 1,
              }}
              transition={{
                rotate: showAnnouncementCard 
                  ? { duration: 0.3 } 
                  : { repeat: Infinity, repeatDelay: 3, duration: 0.9, ease: "easeInOut" },
                scale: {
                  repeat: showAnnouncementCard ? 0 : Infinity,
                  repeatDelay: 3,
                  duration: 0.9,
                }
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="pointer-events-auto w-12 h-12 rounded-full bg-[#0a0a0a] border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] group relative"
            >
              <AnimatePresence mode="wait">
                {showAnnouncementCard ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                  >
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bell"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <Bell className="w-6 h-6 fill-primary/10 group-hover:fill-primary/20 transition-all" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Double Pulse Effect (Softer) - Only visible when NOT open */}
              {!showAnnouncementCard && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary/15 animate-ping [animation-duration:2.5s]" />
                  <span className="absolute inset-0 rounded-full bg-primary/10 animate-ping [animation-duration:3.5s] [animation-delay:0.8s]" />
                </>
              )}
              
              {/* Alert Badge */}
              <span className="absolute top-0 right-0 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-[#0a0a0a]" />
              </span>
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
