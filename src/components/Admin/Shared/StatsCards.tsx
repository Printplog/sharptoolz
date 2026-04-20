import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { type LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface StatData {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  isComingSoon?: boolean;
  action?: {
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
  };
}

interface StatsCardsProps {
  stats: StatData[];
  isLoading?: boolean;
  className?: string;
}

function HoverScrollableValue({ value, isComingSoon }: { value: string | number, isComingSoon?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const text = textRef.current;

      if (!container || !text) return;

      const nextDistance = Math.max(0, text.scrollWidth - container.clientWidth);
      setOverflowDistance(nextDistance);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    if (textRef.current) observer.observe(textRef.current);

    return () => observer.disconnect();
  }, [value]);

  if (isComingSoon && !value) return null;

  const duration = Math.max(2.5, overflowDistance / 24);
  const scrollStyle =
    overflowDistance > 0
      ? ({
          "--stat-scroll-distance": `${overflowDistance}px`,
          transitionDuration: `${duration}s`,
        } as CSSProperties)
      : undefined;

  return (
    <div ref={containerRef} className="overflow-hidden">
      <h3
        ref={textRef}
        title={String(value)}
        style={scrollStyle}
          className={cn(
          "font-black text-white tracking-tighter whitespace-nowrap pr-6 transition-transform ease-linear",
          isComingSoon ? "text-[10px] text-white/20 uppercase italic" : "text-4xl",
          overflowDistance > 0 && "group-hover:translate-x-[calc(var(--stat-scroll-distance)*-1)]"
        )}
      >
        {value}
      </h3>
    </div>
  );
}

export function StatsCards({ stats, isLoading, className }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", className)}>
        {stats.map((_, i) => (
          <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-4 w-24 bg-white/10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            </div>
            <Skeleton className="h-10 w-20 bg-white/10 rounded-lg mb-2" />
            <Skeleton className="h-4 w-32 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", className)}>
        {stats.map((stat) => (
          <div
            key={stat.title}
            className={cn(
              "relative group overflow-hidden bg-gradient-to-br border rounded-2xl p-6 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5",
              stat.gradient,
              stat.borderColor
            )}
          >
            <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
              <stat.icon size={120} />
            </div>

            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                    {stat.title}
                  </p>
                  {stat.isComingSoon && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-white/20 hover:text-primary transition-colors cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-white/10 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg shadow-2xl">
                        Coming Soon to SharpToolz
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className={cn("p-2.5 rounded-xl bg-white/10 border border-white/10 shadow-inner", stat.iconColor)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                   {!stat.isComingSoon ? (
                    <HoverScrollableValue value={stat.value} />
                  ) : (
                     <div className="flex flex-col gap-2">
                        {stat.action && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); stat.action?.onClick?.(); }}
                            className="h-8 w-fit px-6 rounded-full bg-white/5 border-white/10 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 hover:border-white/20 transition-all group/btn shadow-xl"
                          >
                            <stat.action.icon className="h-3 w-3 mr-2 group/btn-hover:scale-110 transition-transform" />
                            {stat.action.label}
                          </Button>
                        )}
                        <HoverScrollableValue value={stat.value} isComingSoon={stat.isComingSoon} />
                     </div>
                  )}
                  <p className="text-white/40 text-[10px] mt-1 font-medium uppercase tracking-tight">
                    {stat.label}
                  </p>
                </div>

                {!stat.isComingSoon && stat.action && (
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); stat.action?.onClick?.(); }}
                    className="h-8 w-full rounded-xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all group/btn"
                  >
                    <stat.action.icon className="h-3 w-3 mr-2 group/btn-hover:rotate-90 transition-transform" />
                    {stat.action.label}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
