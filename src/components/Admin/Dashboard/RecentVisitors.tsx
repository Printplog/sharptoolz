"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAdminDateTime } from "@/lib/utils/adminDate";
import { cn } from "@/lib/utils";

interface Visitor {
  id: number;
  ip_address: string | null;
  visitor_id: string | null;
  session_key: string | null;
  path: string;
  timestamp: string;
  user__username: string | null;
  method: string;
  visit_count: number;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  channel_group: string | null;
  source_label: string;
}

interface RecentVisitorsProps {
  data: Visitor[] | undefined;
  isLoading?: boolean;
  rangeLabel?: string;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; indicator: string }> = {
  GET: {
    bg: "bg-[#1e293b]", // Deep blue
    text: "text-[#38bdf8]", // Sky blue
    indicator: "bg-[#0ea5e9]",
  },
  POST: {
    bg: "bg-[#451a03]", // Deep amber
    text: "text-[#fbbf24]", // Amber
    indicator: "bg-[#f59e0b]",
  },
  VIEW: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    indicator: "bg-emerald-500",
  },
  DEFAULT: {
    bg: "bg-white/5",
    text: "text-white/40",
    indicator: "bg-white/20",
  }
};

export default function RecentVisitors({ data, isLoading, rangeLabel }: RecentVisitorsProps) {
  if (isLoading) {
    return (
      <Card className="bg-[#0a0a0a] border-white/5">
        <CardHeader className="py-3 px-4 border-b border-white/5">
          <Skeleton className="h-4 w-32 bg-white/5" />
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-1 px-4 border-b border-white/[0.02]">
              <Skeleton className="h-3 w-32 bg-white/5" />
              <Skeleton className="h-3 w-10 bg-white/5" />
              <Skeleton className="h-3 w-64 bg-white/5" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#0a0a0a] border-white/5 font-mono text-[11px] leading-none overflow-hidden">
      <CardHeader className="py-2 px-4 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          Visitor <span className="text-zinc-400">Activity Stream</span> ({rangeLabel || "Live"})
        </CardTitle>
        <div className="flex gap-2 text-[9px] uppercase tracking-widest text-zinc-500">
          <span>Identity-based tracking enabled</span>
          <span>•</span>
          <span>Buffer: 100</span>
        </div>
      </CardHeader>


      <CardContent className="p-0 max-h-[600px] overflow-y-auto no-scrollbar">
        {!data || data.length === 0 ? (
          <div className="p-8 text-center text-white/10 uppercase tracking-[0.5em]">
            Waiting for signals...
          </div>
        ) : (
          <div className="flex flex-col">
            {data.map((visitor, index) => {
              const color = METHOD_COLORS[visitor.method] || METHOD_COLORS.DEFAULT;
              const identifier = visitor.user__username || 
                               (visitor.visitor_id ? `ID:${visitor.visitor_id.slice(-8)}` : (visitor.ip_address || "0.0.0.0"));
              
              return (
                <div 
                  key={`${visitor.visitor_id}-${visitor.timestamp}-${index}`}
                  className="group flex items-center gap-4 py-1 px-4 border-b border-white/[0.02] hover:bg-white/[0.03] transition-colors relative"
                >
                  {/* Left Indicator bar */}
                  <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 opacity-50", color.indicator)} />
                  
                  {/* Timestamp */}
                  <span className="text-zinc-500 whitespace-nowrap min-w-[150px]">
                    {formatAdminDateTime(visitor.timestamp)}
                  </span>


                  {/* Level / Method Badge */}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-[2px] text-[9px] font-black uppercase min-w-[50px] text-center",
                    color.bg,
                    color.text
                  )}>
                    {visitor.method === 'VIEW' ? 'VISIT' : visitor.method.toLowerCase()}
                  </span>

                  {/* Message Content */}
                  <div className="flex-1 flex gap-2 items-center min-w-0">
                    <span className="text-white/80 truncate font-black" title={visitor.path}>
                      {visitor.path}
                    </span>
                  </div>

                  {/* Secondary Details */}
                  <div className="flex items-center gap-4 shrink-0 text-zinc-500 whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-zinc-300 font-black uppercase tracking-tighter tabular-nums">
                            {identifier}
                        </span>
                        <span className="text-[8px] text-zinc-600 opacity-80">
                            {visitor.ip_address}
                        </span>
                    </div>

                    
                    {visitor.source && (
                      <span className="text-amber-500/80 font-black px-1 border border-amber-500/20 rounded">
                         via {visitor.source_label}
                      </span>
                    )}

                    <div className="flex items-center gap-1 min-w-[60px] justify-end">
                        <span className="text-zinc-600 uppercase text-[9px]">SESSIONS</span>
                        <span className="text-emerald-500 font-black">{visitor.visit_count}</span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <div className="py-2 px-4 border-t border-white/5 bg-[#0d0d0d] flex justify-between items-center">
        <div className="flex gap-4">
           <span className="text-emerald-500/50 flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               Telemetry Active
            </span>
           <span className="text-white/10 text-[9px] uppercase tracking-widest">Protocol: Identity-V1</span>
        </div>
        <span className="text-white/5 italic opacity-20">vuid_persistence_layer</span>
      </div>
    </Card>
  );
}
