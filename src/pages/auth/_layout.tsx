import Logo from "@/components/Logo";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AuthLayout() {
  const navigate = useNavigate();

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
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-sm text-white"
        >
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 mb-10 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={15} />
            Back
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
