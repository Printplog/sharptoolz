import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  MousePointer2,
  Download,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  DownloadCloud,
  Loader2
} from "lucide-react";

export default function AnimatedFormSection() {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0); // 0: init, 1: typing, 2: to button, 3: loading, 4: done
  const [text, setText] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const fullText = "Alex Rivera";
  
  // Master sequence control
  useEffect(() => {
    let isActive = true;
    
    const sequence = async () => {
      if (!isActive) return;

      // Step 0: Initial state
      setStep(0);
      setShowNotification(false);
      setText("");
      
      await new Promise(r => setTimeout(r, 1500));
      if (!isActive) return;
      
      // Step 1: Start typing
      setStep(1);
      await new Promise(r => setTimeout(r, 2000));
      if (!isActive) return;
      
      // Step 2: Mouse moves to button
      setStep(2);
      await new Promise(r => setTimeout(r, 1200));
      if (!isActive) return;
      
      // Step 3: Click and show loading
      setStep(3);
      await new Promise(r => setTimeout(r, 1200));
      if (!isActive) return;

      // Step 4: Show notification
      setStep(4);
      setShowNotification(true);
      await new Promise(r => setTimeout(r, 4000));
      if (!isActive) return;
      
      // Reset for loop
      setShowNotification(false);
      await new Promise(r => setTimeout(r, 1000));
      if (!isActive) return;
      
      sequence();
    };
    
    sequence();
    return () => { isActive = false; };
  }, []);

  // Update scale factor on resize to perfectly fit screen width
  useEffect(() => {
    const updateScale = () => {
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        const padding = width < 640 ? 48 : 64; // More conservative padding for mobile
        const targetWidth = 1024;
        const availableWidth = width - padding;
        const newScale = Math.max(0.1, Math.min(1, availableWidth / targetWidth));
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Typing effect
  useEffect(() => {
    if (step === 1) {
      let i = 0;
      setText("");
      const typeTimer = setInterval(() => {
        if (i < fullText.length) {
          setText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeTimer);
        }
      }, 100);
      return () => clearInterval(typeTimer);
    }
  }, [step]);

  return (
    <div className="pt-4 md:pt-12 pb-6 md:pb-12 px-4 w-full flex flex-col items-center">
      {/* Container to handle the scaled layout dimensions */}
      <div 
        ref={containerRef}
        style={{ 
          width: scale < 1 ? `${1024 * scale}px` : "1024px",
          maxWidth: "100%",
          height: scale < 1 ? `${640 * scale}px` : "640px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflow: "visible",
          transition: "all 0.3s ease"
        }}
      >
        {/* Scaling Wrapper (Separated from motion to avoid transform conflicts) */}
        <div 
          style={{ 
            transform: scale < 1 ? `scale(${scale})` : "none",
            transformOrigin: "top center",
            width: "1024px",
            flexShrink: 0
          }}
        >
          {/* MacOS Window with Animations */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-[1024px] rounded-3xl md:rounded-2xl border border-white/10 bg-[#0A0D11]/90 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden relative"
          >
        {/* Browser-style Notification (Inside Window) */}
        <div className="absolute top-14 right-6 z-[100] pointer-events-none">
          <AnimatePresence>
            {showNotification && (
              <motion.div 
                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                className="bg-[#101418] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 min-w-[280px] backdrop-blur-md"
              >
                <div className="w-10 h-10 rounded-full bg-[#cee88c]/20 flex items-center justify-center">
                  <DownloadCloud className="w-5 h-5 text-[#cee88c]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[10px] font-black text-white uppercase tracking-wider">Download Started</div>
                  <div className="text-[9px] text-white/50">sharptoolz_premium_card.pdf</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#cee88c]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Fake Cursor */}
        <motion.div 
          initial={{ x: 500, y: 600, opacity: 0 }}
          animate={{ 
            x: step === 0 ? 120 : step === 1 ? 120 : (step === 2 || step === 3) ? 180 : 500, 
            y: step === 0 ? 260 : step === 1 ? 260 : (step === 2 || step === 3) ? 490 : 600,
            scale: step === 3 ? 0.9 : 1,
            opacity: step === 4 ? 0 : 1
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute z-[60] pointer-events-none"
        >
          <MousePointer2 className="w-6 h-6 text-white fill-black drop-shadow-2xl" />
        </motion.div>

        {/* Title Bar */}
        <div className="h-12 border-b border-white/5 flex items-center px-6 bg-white/5 backdrop-blur-md">
          <div className="flex gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-inner shadow-black/10" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-inner shadow-black/10" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] shadow-inner shadow-black/10" />
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/30 font-medium text-[10px] uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            SharpToolz
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-row min-h-[520px] w-full">
          {/* Left Side: Form */}
          <div className="w-[360px] shrink-0 p-8 border-r border-white/5 bg-black/10 relative">
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#cee88c]/10 border border-[#cee88c]/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#cee88c]" />
                </div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Document Details</h4>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5 opacity-60">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Internal Reference</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/50 font-mono italic">
                    REF-883-129-442
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-widest px-1 transition-colors ${step <= 1 ? 'text-[#cee88c]' : 'text-white/40'}`}>Cardholder Full Name</label>
                  <motion.div 
                    animate={{ scale: step === 1 ? 1.02 : 1 }}
                    className={`transition-all duration-300 rounded-xl border px-4 py-3 text-sm font-medium ${step === 1 ? 'bg-white/10 border-[#cee88c]/50 shadow-[0_0_15px_rgba(206,232,140,0.1)]' : 'bg-white/5 border-white/10'}`}
                  >
                    <div className="flex items-center gap-2">
                       {step >= 1 ? (
                        <span className="text-white">
                          {text}
                          {step === 1 && (
                            <motion.span 
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                              className="inline-block w-0.5 h-4 bg-[#cee88c] ml-0.5 align-middle"
                            />
                          )}
                        </span>
                      ) : (
                        <span className="text-white/10 italic font-normal">Alex Rivera...</span>
                      )}
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-3 opacity-60">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Valid From</label>
                      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/50 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        01/2024
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Valid Until</label>
                      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/50 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        01/2028
                      </div>
                   </div>
                </div>

                <div className="space-y-1.5 opacity-60">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1 block w-full">Mailing Address</label>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/50 flex items-center gap-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    123 Empire Ave, New York, NY
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 flex justify-center">
                <motion.div 
                  animate={{ 
                    scale: step === 3 ? 0.95 : (step === 2 || step === 4) ? 1.05 : 1,
                  }}
                  className="relative pl-6 pr-1.5 py-1.5 bg-[#cee88c] text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center justify-between min-w-[160px] shadow-xl shadow-[#cee88c]/10 overflow-hidden"
                >
                  <span className="relative z-10">
                    {step === 3 ? 'Syncing...' : step === 4 ? 'Verified' : 'Finalize Card'}
                  </span>
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full border border-black/20 bg-transparent">
                    {step === 3 ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : step === 4 ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </div>
                  
                  {/* Slide reveal simulation */}
                  <motion.div
                    animate={{ x: step >= 2 ? "0%" : "-100%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 bg-white/30"
                  />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Side: Virtual Card Preview */}
          <div className="min-w-[664px] w-[664px] p-8 bg-black/40 flex items-center justify-center relative">
             {/* Subtle background glow */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#cee88c]/5 blur-[120px] rounded-full pointer-events-none" />

             {/* The Card */}
             <motion.div 
               animate={{ 
                 scale: step === 4 ? 1.05 : 1,
                 rotateY: step === 4 ? 10 : 0
               }}
               className="relative w-full max-w-[420px] aspect-[1.586/1] rounded-2xl p-8 bg-[#1A1D21] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden"
             >
                <div className="absolute inset-0 opacity-[0.1]" 
                     style={{ 
                       backgroundImage: 'radial-gradient(circle, #cee88c 1px, transparent 1px)', 
                       backgroundSize: '16px 16px' 
                     }} 
                />

                {/* Card Top Branding */}
                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#cee88c] flex items-center justify-center shadow-[0_0_15px_rgba(206,232,140,0.3)]">
                        <ShieldCheck className="w-5 h-5 text-black" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-[12px] font-black text-white/90 uppercase tracking-widest leading-none">SHARPTOOLZ</div>
                        <div className="text-[8px] font-bold text-[#cee88c] uppercase tracking-tighter opacity-70">PREMIUM IDENTIFICATION</div>
                      </div>
                   </div>
                   <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[7px] font-bold text-white/30 uppercase tracking-[0.2em] backdrop-blur-sm">
                      VERIFIED
                   </div>
                </div>

                {/* Card Main Info */}
                <div className="flex gap-8 relative z-10">
                   <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden backdrop-blur-sm group">
                      <User className="w-12 h-12 text-white/10" />
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#cee88c]/20 blur-sm" />
                   </div>

                   <div className="flex-1 space-y-4 pt-1">
                      <div className="space-y-1">
                         <div className="text-[7px] font-black text-[#cee88c]/40 uppercase tracking-widest">Full Legal Name</div>
                         <div className="text-[20px] font-bold text-white/90 leading-none tracking-tight">
                            {step >= 1 ? text.toUpperCase() : "ALEX RIVERA"}
                            {step === 1 && <span className="animate-pulse">|</span>}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                         <div className="space-y-1">
                            <div className="text-[6px] font-bold text-white/30 uppercase tracking-widest">Employee Class</div>
                            <div className="text-[10px] font-black text-[#cee88c]">LEVEL-A</div>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[6px] font-bold text-white/30 uppercase tracking-widest">Access Status</div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/80">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#cee88c] animate-pulse" />
                               AUTHORIZED
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Technical Token */}
                <div className="absolute right-6 bottom-6 text-[8px] uppercase font-bold tracking-[0.2em] text-white/10 italic">
                  0xFORM_CORE_V1
                </div>

                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-linear-to-r from-transparent via-[#cee88c]/20 to-transparent" />
             </motion.div>
          </div>
        </div>

        {/* User-Facing status Footer */}
        <div className="h-10 border-t border-white/5 bg-black/40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-medium text-white/30 uppercase tracking-widest">
             <Info className="w-3.5 h-3.5 text-[#cee88c]" />
             <span>
               {step === 0 && "Ready to sync"}
               {step === 1 && "Mapping form fields..."}
               {step === 2 && "Awaiting finalization..."}
               {step === 3 && "Processing document..."}
               {step === 4 && "Document verified successfully"}
             </span>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5 grayscale opacity-50 contrast-125">
                {[0, 1, 2, 3, 4].map(idx => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${step === idx ? 'bg-[#cee88c]' : 'bg-white/10'}`} />
                ))}
             </div>
             <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                <Sparkles className="w-3 h-3" />
                SharpToolz
             </div>
          </div>
        </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
