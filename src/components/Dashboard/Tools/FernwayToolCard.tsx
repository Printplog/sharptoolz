import { useState } from "react";
import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { Tool } from "@/types";
import { FernwayCardGuilloche, FernwayLogo, FernwayMark } from "./Fernway/FernwayLogo";

type Props = {
  delay?: number;
  tool?: Tool;
};

function FernwayCardArtwork({ large = false }: { large?: boolean }) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden flex flex-col items-center justify-center ${
        large ? "p-10 sm:p-14" : "p-5 pb-28"
      }`}
      style={{
        background:
          "radial-gradient(circle at 20% 15%, rgba(16, 185, 129, 0.32), transparent 55%), radial-gradient(circle at 85% 80%, rgba(52, 211, 153, 0.18), transparent 50%), linear-gradient(160deg, #0b1b15 0%, #0c1412 60%, #080d0b 100%)",
      }}
    >
      {/* Subtle banknote guilloché watermark */}
      <FernwayCardGuilloche
        className={`absolute text-emerald-400/20 ${
          large ? "-right-16 -bottom-16 size-80" : "-right-12 -top-10 size-52"
        }`}
      />

      {/* Branded Fernway Card Preview */}
      <div
        className={`relative w-full rounded-2xl border border-emerald-300/25 shadow-2xl overflow-hidden flex flex-col justify-between transition-transform duration-700 group-hover/card:scale-105 ${
          large ? "max-w-lg aspect-[1.586/1] p-7 sm:p-8" : "max-w-[270px] aspect-[1.6/1] p-4"
        }`}
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #047857 52%, #022c22 100%)",
        }}
      >
        {/* Card interior guilloché sheen */}
        <FernwayCardGuilloche
          className={`absolute text-emerald-200/25 ${
            large ? "-right-12 -bottom-16 size-64" : "-right-10 -bottom-12 size-40"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

        {/* Card Top: Official Fernway Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <FernwayLogo
            markClassName={large ? "size-8 text-emerald-200" : "size-5 text-emerald-200"}
            textClassName={large ? "text-xl font-bold text-white" : "text-sm font-bold text-white"}
          />
          <span
            className={`rounded-full bg-black/25 border border-white/15 font-semibold uppercase tracking-wider text-white/90 ${
              large ? "px-3 py-1 text-[11px]" : "px-2 py-0.5 text-[9px]"
            }`}
          >
            Online Banking
          </span>
        </div>

        {/* Chip */}
        <div className="relative z-10 flex items-center gap-2.5 my-1">
          <div
            className={`rounded-md bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 border border-amber-200/70 shadow-xs ${
              large ? "w-11 h-8" : "w-8 h-5"
            }`}
          />
          <FernwayMark
            className={`text-white/25 ${large ? "size-6" : "size-4"}`}
          />
        </div>

        {/* Card Bottom */}
        <div className="relative z-10 space-y-1">
          <div
            className={`font-mono font-semibold tracking-[0.2em] text-white/95 ${
              large ? "text-lg" : "text-xs"
            }`}
          >
            •••• •••• •••• 8892
          </div>
          <div
            className={`flex items-center justify-between font-mono text-white/75 ${
              large ? "text-xs" : "text-[9px]"
            }`}
          >
            <span>LINDENWAY MEMBER</span>
            <span>12/28</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FernwayToolCard({ delay = 0, tool }: Props) {
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const title = tool?.name || "Lindenway Online Banking";
  const description =
    tool?.description ||
    "Set up a custom online banking account with balances, debit card & transactions";
  const badgeText = tool?.badge?.trim() || "HOT TOOL";
  const monthlyPrice =
    tool?.price !== undefined && Number.isFinite(Number(tool.price))
      ? Number(tool.price)
      : null;

  const handleCardClick = () => {
    setIsPreviewOpen(true);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/tools/fernway");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        whileHover={{ y: -5 }}
        onClick={handleCardClick}
        className="relative h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/2 backdrop-blur-2xl p-6 transition-all duration-500 hover:border-white/20 cursor-pointer group/card"
      >
        {/* Background Glow */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

        {/* Preview Artwork with Official Fernway Logo */}
        <div
          className="absolute inset-0 p-3 pointer-events-none z-0"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 98%)",
            maskImage: "linear-gradient(to bottom, black 55%, transparent 98%)",
          }}
        >
          <div className="h-full rounded-2xl overflow-hidden border border-white/5">
            <FernwayCardArtwork />
          </div>
        </div>

        {/* Top Badges — matches DashboardToolCard */}
        <div className="absolute top-6 left-6 z-30 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-[11px] font-semibold shadow-lg shadow-orange-500/20">
            🔥 {badgeText}
          </div>
          {monthlyPrice !== null && (
            <div className="px-2.5 py-1 rounded-full bg-black/65 border border-white/15 text-white text-[11px] font-mono font-semibold backdrop-blur-md">
              ${monthlyPrice.toFixed(2)}/mo
            </div>
          )}
        </div>

        {/* Bottom Overlay Content */}
        <div className="absolute bottom-0 left-0 w-full z-10 p-6 pt-24 flex flex-col gap-4 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <FernwayMark className="size-5 text-emerald-400" />
              <h3 className="text-white text-xl font-black tracking-tighter truncate drop-shadow-md">
                {title}
              </h3>
            </div>
            <p className="text-white/50 text-[11px] leading-snug line-clamp-2 font-medium">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <PremiumButton
              text="Use Tool"
              icon={Zap}
              onClick={handleActionClick}
              variant="primary"
              className="w-full text-[11px] italic"
              iconRotation={0}
            />
          </div>
        </div>
      </motion.div>

      {/* Full Preview Modal — matches BannerPreviewModal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none">
          <DialogTitle className="sr-only">Lindenway Online Banking Preview</DialogTitle>
          <div className="relative bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all border border-white/10 cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="min-h-[360px]">
              <FernwayCardArtwork large />
            </div>
            <div className="p-6 border-t border-white/10 bg-[#0a0a0a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {title}
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  {description}
                </p>
              </div>
              <PremiumButton
                text="Open Setup"
                icon={Zap}
                variant="primary"
                onClick={() => {
                  setIsPreviewOpen(false);
                  navigate("/tools/fernway");
                }}
                className="shrink-0 text-xs"
                iconRotation={0}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
