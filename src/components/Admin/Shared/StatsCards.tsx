import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

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
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((_, i) => (
          <div key={i} className="bg-gradient-to-br border rounded-2xl p-6 backdrop-blur-md border-white/10 bg-white/5">
            <Skeleton className="h-10 w-10 rounded-lg bg-white/10 mb-4" />
            <Skeleton className="h-3 w-24 rounded-full bg-white/10 mb-2" />
            <Skeleton className="h-8 w-32 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className={`bg-gradient-to-br ${stat.gradient} ${stat.borderColor} border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
              {stat.title}
            </p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
