import Logo from "@/components/Logo";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine back destination based on current path
  const getBackDestination = () => {
    if (location.pathname === "/auth/forgot-password" || location.pathname === "/auth/reset-password") {
      return "/auth/login";
    }
    return "/";
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center border-r border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0F172A] to-[#0a0e1a]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#cee88c]/[0.04] rounded-full blur-[120px]" />

        <div className="relative z-10 flex flex-col items-center gap-4 px-12">
          <Logo size={44} noLink />
          <p className="text-white/30 text-sm text-center max-w-[240px] leading-relaxed">
            Create, customize, and share professional tools with ease.
          </p>
        </div>

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 pt-12 pb-20 relative overflow-hidden">
        {/* Premium Background Grid Effect (Edges only) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className="absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.07) 1.5px, transparent 1.5px),
                linear-gradient(to bottom, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)
              `,
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(circle at center, transparent 10%, black 90%)",
              WebkitMaskImage: "radial-gradient(circle at center, transparent 10%, black 90%)",
            }}
          />
        </div>

        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm text-white relative z-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(getBackDestination())}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 mb-10 text-white/40 hover:text-white hover:border-white/20 transition-all shadow-lg"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:hidden flex justify-center mb-10"
          >
            <Logo />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </motion.main>
      </div>
    </div>
  );
}
