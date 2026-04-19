import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatData {
  title: string;
  value: string | number;
  label: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}

interface StatsCardsProps {
  stats: StatData[];
  isLoading?: boolean;
  className?: string;
}

function HoverScrollableValue({ value }: { value: string | number }) {
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
          "text-4xl font-black text-white tracking-tighter whitespace-nowrap pr-6 transition-transform ease-linear",
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
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
              </div>
              <div className={cn("p-2.5 rounded-xl bg-white/10 border border-white/10 shadow-inner", stat.iconColor)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>

            <div>
              <HoverScrollableValue value={stat.value} />
              <p className="text-white/40 text-[10px] mt-2 font-medium uppercase tracking-tight">
                {stat.label}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
