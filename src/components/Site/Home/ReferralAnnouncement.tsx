import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import SectionPadding from "@/layouts/SectionPadding";
import { ArrowRight, Calculator, Plus, Minus } from "lucide-react";
import {
  motion,
  useMotionValue,
  useTransform,
  useMotionValueEvent,
  animate,
  type MotionValue,
} from "framer-motion";
import { useState, useMemo, useEffect, useRef, useId } from "react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// SVGConnector — animated L-shaped signal path between step cards
// ─────────────────────────────────────────────────────────────────────────────

const SVGConnector = ({ progress, range, type, color = "#cee88c", colorEnd = "#cee88c" }: any) => {
  const uid      = useId().replace(/:/g, "");
  const wrapRef  = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const drawRef  = useRef<SVGPathElement>(null);
  const glowRef  = useRef<SVGCircleElement>(null);
  const dotRef   = useRef<SVGCircleElement>(null);
  const lengthRef = useRef(0);
  const widthRef  = useRef(0);

  // Responsive logic
  const [height, setHeight] = useState(160);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setHeight(mobile ? 120 : 160);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const CORNER = 36;

  function makePath(w: number, h: number): string {
    const cx = w / 2;
    if (isMobile) {
      // Straight vertical line for mobile
      return `M ${cx} 0 L ${cx} ${h}`;
    }
    const offset = Math.min(w * 0.22, 120);
    if (type === "top-right") {
      const ex = cx + offset;
      return [`M ${cx} 0`, `L ${ex - CORNER} 0`, `Q ${ex} 0 ${ex} ${CORNER}`, `L ${ex} ${h}`].join(" ");
    }
    const ex = cx - offset;
    return [`M ${cx} 0`, `L ${ex + CORNER} 0`, `Q ${ex} 0 ${ex} ${CORNER}`, `L ${ex} ${h}`].join(" ");
  }

  useEffect(() => {
    const sync = () => {
      if (!wrapRef.current || !trackRef.current || !drawRef.current) return;
      const w = wrapRef.current.offsetWidth;
      if (w === widthRef.current) return;
      widthRef.current = w;
      const d = makePath(w, height);
      trackRef.current.setAttribute("d", d);
      drawRef.current.setAttribute("d", d);
      const len = trackRef.current.getTotalLength();
      lengthRef.current = len;
      drawRef.current.style.strokeDasharray  = String(len);
      drawRef.current.style.strokeDashoffset = String(len);
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [type, height, isMobile]);

  const localT = useTransform(progress, range, [0, 1], { clamp: true });

  useMotionValueEvent(localT, "change", (t) => {
    const len = lengthRef.current;
    if (!len || !trackRef.current || !drawRef.current || !dotRef.current || !glowRef.current) return;
    const drawn = t * len;
    drawRef.current.style.strokeDashoffset = String(len - drawn);
    const pt = trackRef.current.getPointAtLength(drawn);
    const cx = String(pt.x);
    const cy = String(pt.y);
    dotRef.current.setAttribute("cx", cx);
    dotRef.current.setAttribute("cy", cy);
    glowRef.current.setAttribute("cx", cx);
    glowRef.current.setAttribute("cy", cy);
    const fade = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1;
    dotRef.current.style.opacity  = String(fade);
    glowRef.current.style.opacity = String(fade * 0.5);
  });

  const gradId   = `sg-${uid}`;
  const filterId = `gf-${uid}`;

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-7xl mx-auto pointer-events-none"
      style={{
        height,
        marginTop:    isMobile ? -20 : -(height / 2),
        marginBottom: isMobile ? -20 : -(height / 2),
        position: "relative",
        zIndex: 5,
      }}
    >
      <svg width="100%" height={height} style={{ overflow: "visible", position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2={isMobile ? "0%" : "100%"} y2="100%">
            <stop offset="0%"   stopColor={color} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
          <filter id={filterId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path ref={trackRef} d="" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path ref={drawRef}  d="" fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <circle ref={glowRef} r={18} fill={color} opacity={0} style={{ filter: "blur(12px)" }} />
        <circle ref={dotRef}  r={4.5} fill={color} opacity={0} filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Themes
// ─────────────────────────────────────────────────────────────────────────────

interface StepProps {
  image: string;
  title: string;
  description: string;
  progress: MotionValue<number>;
  range: [number, number];
  theme: { from: string; border: string; pulse: string; accent: string };
  align?: "left" | "right";
}

const cardThemes = {
  orange:  { from: "from-orange-500/20 to-orange-600/5",  border: "border-orange-500/20",  pulse: "via-orange-500/40",  accent: "text-orange-500"  },
  blue:    { from: "from-blue-500/20 to-blue-600/5",      border: "border-blue-500/20",    pulse: "via-blue-500/40",    accent: "text-blue-500"    },
  emerald: { from: "from-emerald-500/20 to-emerald-600/5",border: "border-emerald-500/20", pulse: "via-emerald-500/40", accent: "text-emerald-500" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Step
// ─────────────────────────────────────────────────────────────────────────────

const Step = ({ image, title, description, progress, range, theme, align = "left" }: StepProps) => {
  const isRight = align === "right";
  const sweepY  = useTransform(progress, range, ["-100%", "100%"]);
  const sweepOp = useTransform(progress, [range[0], range[0] + 0.05, range[1] - 0.05, range[1]], [0, 1, 1, 0]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Restore perfect desktop defaults
  const imgVar = isMobile ? "clamp(15rem, 50vw, 25rem)" : "clamp(18rem, 30vw, 30rem)";

  return (
    <div
      className={cn("relative w-full max-w-5xl mx-auto flex z-20", isRight ? "justify-end" : "justify-start")}
      style={{ "--img": imgVar } as React.CSSProperties}
    >
      <div
        className={cn(
          "relative group overflow-visible w-full max-w-xl transition-all duration-500", 
          isRight ? "pr-2 md:pr-8" : "pl-2 md:pl-8"
        )}
        // Desktop: original 0.08, Mobile: tighten to 0.10 for perfect gap
        style={{ paddingTop: isMobile ? "calc(var(--img) * 0.10)" : "calc(var(--img) * 0.08)" }}
      >

        {/* ── Image ── always taller+wider than the card ── */}
        <motion.div
          initial={{ y: 0 }}
          whileHover={{ y: -15, scale: 1.05 }}
          className={cn(
            "absolute bottom-0 z-30 pointer-events-none drop-shadow-[0_40px_80px_rgba(0,0,0,0.8)]",
            isRight ? "right-0" : "left-0",
          )}
          style={{
            width:  "var(--img)",
            height: "var(--img)",
            // Desktop: original -22%, Mobile: conservative -5%
            marginRight: isRight ? (isMobile ? "calc(var(--img) * -0.05)" : "calc(var(--img) * -0.22)") : undefined,
            marginLeft:  isRight ? undefined : (isMobile ? "calc(var(--img) * -0.05)" : "calc(var(--img) * -0.22)"),
          }}
        >
          <img src={image} alt={title} className="w-full h-full object-contain" />
        </motion.div>

        {/* ── Animated border wrapper ── */}
        <div className="relative p-[1px] rounded-[2rem] md:rounded-[4rem] overflow-hidden z-10">
          <motion.div
            style={{ y: sweepY, opacity: sweepOp }}
            className="absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-primary/50 to-transparent blur-2xl z-0"
          />

          {/*
            Card body:
            - base padding: 1.5rem all sides (mobile)
            - image-side padding = var(--img) * 0.72 so image always covers that side
            - min-h scales with image so card is never taller than the image
          */}
          <div
            className={cn(
              "relative z-10 rounded-[2rem] md:rounded-[4rem] bg-gradient-to-br backdrop-blur-xl h-full flex flex-col justify-center transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5 border",
              theme.from,
              theme.border,
              isRight ? "items-start text-left" : "items-end text-right",
            )}
            style={{
              // Uniform padding base
              padding: "clamp(1rem, 3vw, 4rem)",
              // Override the image side to be wider so text clears the image
              ...(isRight
                ? { paddingRight: "calc(var(--img) * 0.75)", paddingLeft: "clamp(1rem, 3vw, 3rem)" }
                : { paddingLeft:  "calc(var(--img) * 0.75)", paddingRight: "clamp(1rem, 3vw, 3rem)" }),
              // Card is always shorter than the image
              minHeight: "calc(var(--img) * 0.65)",
            }}
          >
            <div className="absolute inset-0 bg-[#070707]/60 z-0 rounded-[2rem] md:rounded-[4rem]" />
            <div className="relative z-30 space-y-2 md:space-y-3">
              <h4
                className="font-black text-white uppercase italic tracking-tighter leading-none"
                style={{ fontSize: "clamp(1.4rem, 4vw, 3rem)" }}
              >
                {title}
              </h4>
              <div className={cn("h-1 rounded-full", theme.accent.replace("text-", "bg-") + "/20")} style={{ width: "clamp(2.5rem, 6vw, 5rem)" }} />
              <p
                className="text-white/40 font-black uppercase leading-none"
                style={{ fontSize: "clamp(0.5rem, 1.2vw, 0.75rem)", letterSpacing: "0.4em" }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function ReferralAnnouncement() {
  const { data: settings } = useQuery({ queryKey: ["siteSettings"], queryFn: getSiteSettings });

  const progress = useMotionValue(0);
  useEffect(() => {
    const controls = animate(progress, 1, { duration: 5.0, repeat: Infinity, ease: "linear" });
    return controls.stop;
  }, [progress]);

  const [numFriends, setNumFriends] = useState<number>(1);
  const [avgDeposit, setAvgDeposit] = useState<number>(50);
  const percentage       = useMemo(() => parseFloat(settings?.referral_percentage || "10"), [settings]);
  const potentialEarning = useMemo(() => (numFriends * avgDeposit * (percentage / 100)).toFixed(0), [numFriends, avgDeposit, percentage]);

  if (settings?.enable_referrals === false) return null;

  return (
    <SectionPadding id="referral-program" className="py-32 relative">
      <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter uppercase italic text-white leading-[0.9] mb-10 max-w-3xl mx-auto">
            Earn by referring <span className="text-primary">your friends</span>
          </h2>
          <p className="text-white/40 max-w-2xl font-medium text-lg md:text-xl leading-relaxed">
            Earn <span className="text-white font-bold">{percentage}%</span> from every deposit your friends make.
            You can withdraw your earnings as soon as you reach the minimum withdrawal threshold.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center mb-40 relative z-10 w-full ">
          <Step image="/refer/image1.webp" title="Join"  description="Acquire Link"   progress={progress} range={[0.0,  0.30]} theme={cardThemes.orange}  align="left"  />
          <SVGConnector progress={progress} range={[0.30, 0.42]} type="top-right" color="#f97316" colorEnd="#3b82f6" />
          <Step image="/refer/image2.webp" title="Share" description="Invite Network" progress={progress} range={[0.42, 0.65]} theme={cardThemes.blue}    align="right" />
          <SVGConnector progress={progress} range={[0.65, 0.77]} type="top-left"  color="#3b82f6" colorEnd="#10b981" />
          <Step image="/refer/image3.webp" title="Earn"  description="Extract Yield"  progress={progress} range={[0.77, 1.0]}  theme={cardThemes.emerald} align="left"  />
        </div>

        {/* ── Yield Estimator (MacOS Style) ────────────────────────────────── */}
        <div className="flex flex-col items-center mt-20">
          {/* Simplified Title (Smaller & Integrated) */}
          <h4 className="text-xl md:text-2xl font-black text-white/80 uppercase italic tracking-tighter mb-8 text-center">
            Calculate How Much <span className="text-primary">You Can Earn</span>
          </h4>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0A0D11]/90 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden relative"
          >
            {/* MacOS Title Bar */}
            <div className="h-10 border-b border-white/5 flex items-center px-6 bg-white/5">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57] opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E] opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28C840] opacity-80" />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/20 font-black text-[9px] uppercase tracking-[0.2em]">
                <Calculator className="w-3 h-3" />
                Sharp Calculator
              </div>
            </div>

            {/* Inner Content (Responsive Grid) */}
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 items-center">
                
                {/* Inputs Side */}
                <div className="space-y-6 md:space-y-8 order-2 md:order-1">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] px-1">Active Invitations</label>
                    <div className="flex items-center gap-4 bg-white/5 rounded-full p-2 border border-white/5 group hover:border-emerald-500/20 transition-all">
                      <button 
                        onClick={() => setNumFriends(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-white/60 active:scale-90"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div className="flex-1 text-center font-black text-2xl text-white">{numFriends}</div>
                      <button 
                        onClick={() => setNumFriends(prev => Math.min(100, prev + 1))}
                        className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/30 transition-colors text-emerald-500 active:scale-90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] px-1">Avg. Deposit ($)</label>
                    <div className="relative h-14 group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-black text-lg">$</span>
                      <input 
                        type="number"
                        value={avgDeposit}
                        onChange={e => setAvgDeposit(Number(e.target.value))}
                        className="w-full h-full bg-white/5 border border-white/5 rounded-full pl-12 pr-6 py-0 text-white font-black focus:outline-none focus:border-emerald-500/20 transition-all text-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Result Side (Stat Card Style) */}
                <div className="relative p-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-[2rem] border border-emerald-500/20 text-center space-y-2 overflow-hidden group order-1 md:order-2 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 space-y-0.5">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Potential Earning</span>
                    <div className="flex items-baseline justify-center gap-2">
                       <motion.span 
                         key={potentialEarning}
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         className="text-5xl md:text-6xl font-black text-emerald-500 tracking-tighter italic drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                       >
                         ${potentialEarning}
                       </motion.span>
                    </div>
                    <span className="text-[9px] font-bold text-white/10 uppercase italic tracking-widest">per cycle</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Window Status Bar */}
            <div className="h-7 border-t border-white/5 bg-black/10 px-6 flex items-center justify-center">
              <div className="flex items-center gap-2 text-[7px] font-medium text-white/5 uppercase tracking-widest">
                Optimized Yield Generation Core V2.4
              </div>
            </div>
          </motion.div>

          {/* Register Button (Fit Content) */}
          <div className="mt-10">
            <PremiumButton
              text="Get Started Now"
              icon={ArrowRight}
              href="/auth/register"
              variant="primary"
              className="h-12 rounded-full text-sm font-black shadow-[0_20px_40px_-10px_rgba(206,232,140,0.2)] whitespace-nowrap"
            />
          </div>
        </div>
      </div>
    </SectionPadding>
  );
}