import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Home } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center px-6 overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] opacity-40 pointer-events-none" />
      
      <div className="relative z-10 text-center space-y-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-4"
        >
          {/* Main Error Indicator */}
          <div className="space-y-0">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[14vw] md:text-[180px] font-black leading-none tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-white/20 select-none pb-4"
            >
              404
            </motion.h1>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="h-px w-24 bg-primary/50 mx-auto"
            />
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-[0.2em] italic">
              Lost in <span className="text-primary italic">Empty Space</span>
            </h2>
            <p className="text-white/30 text-lg font-medium max-w-md mx-auto leading-relaxed">
              The coordinates you requested are no longer available in our systems.
            </p>
          </motion.div>
        </motion.div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
        >
          <Link to="/">
            <PremiumButton 
              text="Return to Base"
              icon={Home}
              className="h-16 px-12 text-lg"
            />
          </Link>
          
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Previous Location
          </button>
        </motion.div>
      </div>

      {/* Decorative floating elements */}
      <motion.div 
        animate={{ 
          y: [-10, 10, -10],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[15%] w-12 h-12 border border-white/5 rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          y: [15, -15, 15],
          rotate: [0, -10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[25%] left-[20%] w-8 h-8 bg-primary/5 rounded-lg rotate-12 pointer-events-none" 
      />

      {/* Bottom info */}
      <div className="absolute bottom-12 left-0 w-full flex flex-col items-center gap-4">
        <div className="h-px w-8 bg-white/10" />
        <span className="text-[9px] font-black uppercase tracking-[0.6em] text-white/10">
          SharpToolz Operations Center
        </span>
      </div>
    </div>
  );
}
