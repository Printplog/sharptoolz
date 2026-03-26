import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FancyProgress } from "@/components/ui/FancyProgress";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CreditCard, TestTube, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

type TestDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTest: () => void;
  onCreatePaid: () => void;
  isSubmitting: boolean;
  price?: number;
};

export function TestDocumentDialog({
  open,
  onOpenChange,
  onCreateTest,
  onCreatePaid,
  isSubmitting,
  price = 5,
}: TestDocumentDialogProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isSubmitting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 15;
        });
      }, 250);
      return () => clearInterval(interval);
    } else {
      setProgress((prev) => (prev > 0 && prev < 100 ? 100 : prev));
    }
  }, [isSubmitting]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!isSubmitting) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none"
        showCloseButton={false}
        noShadow
      >
        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 10 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.95, y: 10 }}
           className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center py-4"
              >
                <div className="relative w-16 h-16 mx-auto">
                   <div className="relative z-10 w-full h-full bg-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                     <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                   </div>
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white tracking-tight">Processing document</h2>
                  <p className="text-white/40 text-xs">Optimizing assets for you</p>
                </div>

                <div className="px-4">
                  <FancyProgress 
                    value={progress}
                    statusText="Finalizing..."
                    isComplete={false}
                    noShadow
                  />
                </div>
              </motion.div>
            ) : progress === 100 ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 mx-auto bg-green-500/5 rounded-full flex items-center justify-center border border-green-500/20">
                   <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">Ready!</h2>
                  <p className="text-white/40 text-xs">Your creation is complete.</p>
                </div>

                <div className="px-4">
                  <FancyProgress value={100} isComplete={true} statusText="Success" noShadow />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="choice"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Select option</h2>
                    <p className="text-white/40 text-sm">
                      How would you like to proceed?
                    </p>
                  </div>
                  
                  <p className="text-sm text-yellow-500/80 font-medium leading-tight text-left">
                    Confirm all fields are correct. No editing after creation.
                  </p>
                </div>

                <div className="grid gap-3">
                  {/* Test Option */}
                  <button
                    onClick={onCreateTest}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                      <TestTube className="w-5 h-5 text-white/50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white/90 font-medium">Test Document</h3>
                      <p className="text-white/30 text-xs">Watermarked version for preview</p>
                    </div>
                  </button>

                  {/* Paid Option */}
                  <button
                    onClick={onCreatePaid}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all text-left group relative"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-primary font-semibold">Premium Document</h3>
                      <p className="text-primary/50 text-xs">Watermark-free • ${price}</p>
                    </div>
                  </button>
                </div>

                <div className="pt-2 text-center space-y-4">
                   <p className="text-[10px] text-white/20 leading-tight px-4 italic">
                     By creating this document, you agree that we are not responsible for how it is used.
                   </p>
                   <button 
                     onClick={() => onOpenChange(false)}
                     className="w-full py-3 rounded-xl border border-white/5 bg-white/2 text-white/40 hover:text-white/80 hover:bg-white/5 font-medium transition-all active:scale-95 text-xs uppercase tracking-widest"
                   >
                     Cancel
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

