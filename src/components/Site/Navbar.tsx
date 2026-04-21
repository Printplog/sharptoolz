import { useState, useEffect } from "react";
import SectionPadding from "../../layouts/SectionPadding";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import { Link, useLocation } from "react-router-dom";
import Logo from "../Logo";
import { useAuthStore } from "@/store/authStore";
import { User, ArrowRight, X, ArrowUpRight } from "lucide-react";
import { PremiumButton } from "../ui/PremiumButton";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { scrollY } = useScroll();
  const pathname = useLocation().pathname;
  const { isAuthenticated } = useAuthStore();
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  // Correct Scroll Logic: 
  // Scroll DOWN (latest > previous) -> HIDE
  // Scroll UP (latest < previous) -> SHOW
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setIsHidden(true); 
    } else {
      setIsHidden(false); 
    }
  });

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/all-tools", label: "All Tools" },
    { href: "/tutorials", label: "Tutorials" },
    {
      href: settings?.whatsapp_community_link || settings?.telegram_link || "#",
      label: "Community",
      isExternal: true
    },
    { href: "/contact", label: "Contact" },
  ];

  // Prevent scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isMenuOpen]);

  return (
    <>
      <motion.nav 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-lg"
      >
        <div className="relative">
          <SectionPadding className="flex justify-between items-center py-4 lg:py-8">
            <Logo />

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.href}
                  target={link.isExternal ? "_blank" : "_self"}
                  className={`transition-colors font-medium text-sm ${
                    link.href === pathname ? "text-primary" : "text-foreground/80 hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-4">
              {isAuthenticated ? (
                <PremiumButton 
                  text="Dashboard" 
                  icon={User} 
                  href="/dashboard" 
                  variant="ghost" 
                  className="min-w-[150px]"
                  noShadow={true}
                />
              ) : (
                <>
                  <PremiumButton 
                    text="Login" 
                    icon={ArrowRight} 
                    href="/auth/login" 
                    variant="ghost" 
                    noShadow={true}
                  />
                  <PremiumButton 
                    text="Register" 
                    icon={ArrowRight} 
                    href="/auth/register" 
                    variant="primary" 
                    noShadow={true}
                  />
                </>
              )}
            </div>

            {/* Premium Custom Staggered Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden w-12 h-12 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-white/3 border border-white/5 hover:border-primary/40 transition-all group"
            >
               <div className="w-6 h-[2px] bg-foreground group-hover:bg-primary transition-colors rounded-full" />
               <div className="w-4 h-[2px] bg-foreground group-hover:bg-primary transition-all rounded-full self-start ml-[9px]" />
               <div className="w-6 h-[2px] bg-foreground group-hover:bg-primary transition-colors rounded-full" />
            </button>
          </SectionPadding>
        </div>
      </motion.nav>

      {/* Full Page Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#0A0D11]/95 backdrop-blur-3xl overflow-y-auto"
          >
            {/* Background Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]" 
                 style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
            
            <SectionPadding className="min-h-screen py-10 flex flex-col">
              {/* Overlay Top Bar */}
              <div className="flex justify-between items-center mb-12 relative z-10">
                <Logo />
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:rotate-90 transition-all duration-500"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col gap-4 relative z-10 mb-12">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={link.href}
                      target={link.isExternal ? "_blank" : "_self"}
                      onClick={() => setIsMenuOpen(false)}
                      className="group flex items-center justify-between py-1.5 border-b border-white/5"
                    >
                      <h2 className={`text-2xl font-fancy font-medium uppercase italic tracking-tighter ${
                        link.href === pathname ? "text-primary" : "text-white/40 group-hover:text-white"
                      }`}>
                        {link.label}
                      </h2>
                      <ArrowUpRight className={`w-5 h-5 ${link.href === pathname ? "text-primary" : "text-white/10 group-hover:text-primary"} transition-all group-hover:rotate-45`} />
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Auth Footer Actions */}
              <div className="mt-auto pt-8 border-t border-white/5 flex flex-col gap-3 relative z-10">
                {isAuthenticated ? (
                  <PremiumButton 
                    text="Access Dashboard" 
                    icon={User} 
                    href="/dashboard" 
                    variant="ghost" 
                    className="w-full h-12 text-xs font-bold uppercase tracking-widest"
                    noShadow={true}
                    onClick={() => setIsMenuOpen(false)}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    <PremiumButton 
                      text="Register" 
                      icon={ArrowRight} 
                      href="/auth/register" 
                      variant="primary" 
                      className="w-full h-12 text-xs font-bold uppercase tracking-widest"
                      noShadow={true}
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <PremiumButton 
                      text="Login" 
                      icon={ArrowRight} 
                      href="/auth/login" 
                      variant="ghost" 
                      className="w-full h-12 text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10"
                      noShadow={true}
                      onClick={() => setIsMenuOpen(false)}
                    />
                  </div>
                )}
                
                <p className="text-center text-white/10 font-bold uppercase tracking-[0.3em] text-[10px] mt-8">
                  SharpToolz - Premium Workflow
                </p>
              </div>
            </SectionPadding>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
