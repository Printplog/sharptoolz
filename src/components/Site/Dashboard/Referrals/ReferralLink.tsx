import { Copy, Check, Share2, Facebook, Gift } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  link: string | undefined;
  isLoading: boolean;
  rewardPercentage?: string;
  minDeposit?: string;
}

export default function ReferralLink({ link, isLoading, rewardPercentage, minDeposit }: Props) {
  const [copied, setCopied] = useState(false);

  const [isShareOpen, setIsShareOpen] = useState(false);

  const shareMessage = `🚀 Join me on SharpToolz and unlock a 10% Cash Bonus! 💰

It's the ultimate all-in-one suite for:
✅ Professional Document Automation
✅ Instant SVG Editing & Watermark-free PDFs

Start creating in seconds here:`;

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .011 5.393 0 12.026c0 2.119.554 4.187 1.605 6.046L0 24l6.126-1.607a11.774 11.774 0 005.92 1.593h.005c6.637 0 12.038-5.393 12.043-12.026a11.75 11.75 0 00-3.515-8.517z" />,
      color: "bg-[#25D366]",
      border: "border-[#25D366]/40",
      onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${link}`)}`, '_blank'),
      isSvg: true
    },
    {
      name: "X (Twitter)",
      icon: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />,
      color: "bg-black",
      border: "border-white/20",
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(link || "")}`, '_blank'),
      isSvg: true
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 fill-current" />,
      color: "bg-[#1877F2]",
      border: "border-[#1877F2]/40",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link || "")}`, '_blank'),
    },
    {
      name: "Telegram",
      icon: <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zM17.07 8.16l-1.63 7.69c-.12.53-.44.66-.88.41l-2.48-1.83-1.2 1.15c-.13.13-.24.24-.49.24l.18-2.52 4.6-4.15c.2-.18-.04-.28-.31-.1l-5.69 3.58-2.45-.77c-.53-.17-.54-.53.11-.79l9.53-3.67c.44-.16.82.1.81.76z" />,
      color: "bg-[#0088cc]",
      border: "border-[#0088cc]/40",
      onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(link || "")}&text=${encodeURIComponent(shareMessage)}`, '_blank'),
      isSvg: true
    }
  ];

  const handleCopy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const rewardAmount = (Number(rewardPercentage || 0) / 100) * Number(minDeposit || 0);
  const formattedReward = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rewardAmount);
  const formattedMin = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(minDeposit || 0));

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border border-white/5 p-8 group">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-tight text-xl italic leading-none">Referral Link</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Share & Earn Rewards</p>
          </div>
        </div>

        <p className="text-white/60 text-xs font-medium leading-relaxed mb-8">
          Share your unique link with friends. When they deposit {formattedMin} or more, you'll earn {formattedReward} instantly!
        </p>

        <div className="space-y-4">
          <div className="relative">
            {isLoading ? (
              <div className="h-12 w-full bg-white/5 animate-pulse rounded-2xl" />
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 h-12 bg-black/40 border border-white/10 rounded-full px-5 flex items-center overflow-hidden">
                  <span className="text-[12px] text-primary font-bold truncate opacity-80 tracking-tight">
                    {link}
                  </span>
                </div>
                
                <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                  <DialogTrigger asChild>
                    <button
                      className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/60 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-95 shrink-0"
                      title="Share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white text-center">Share Referral Link</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-4 gap-4 py-8">
                      {shareOptions.map((option) => (
                        <div key={option.name} className="flex flex-col items-center gap-3 group">
                          <button
                            onClick={option.onClick}
                            className={cn(
                              "w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg border",
                              option.color,
                              option.border
                            )}
                          >
                            {option.isSvg ? (
                              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                                {option.icon}
                              </svg>
                            ) : (
                              option.icon
                            )}
                          </button>
                          <span className="text-[10px] font-black text-white/40 tracking-tight transition-colors group-hover:text-white/80">
                            {option.name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <button
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-full bg-[#cee88c] text-black flex items-center justify-center hover:bg-[#cee88c]/90 transition-all active:scale-95 shrink-0"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-white/5 flex items-center justify-center overflow-hidden scale-100 hover:scale-110 transition-transform cursor-pointer">
                  <img 
                    src={`/ref${num}.jpg`} 
                    alt={`Avatar ${num}`} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#0a0a0a] bg-primary/20 text-primary text-[10px] flex items-center justify-center font-black">
                +1k
              </div>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black tracking-tight text-white">
                Active Referrers
              </span>
              <span className="block text-[9px] font-medium text-white/40 italic">
                Join 1,240+ others
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
