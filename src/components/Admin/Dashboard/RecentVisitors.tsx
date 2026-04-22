"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAdminDateTime, formatAdminRelativeTime } from "@/lib/utils/adminDate";
import { cn } from "@/lib/utils";


interface Visitor {
  ip_address: string | null;
  path: string;
  timestamp: string;
  user__username: string | null;
  method: string;
  visit_count: number;
  source: string | null;
}


interface RecentVisitorsProps {
  data: Visitor[] | undefined;
  isLoading?: boolean;
  rangeLabel?: string;
}

function getMethodStyles(method: string) {
  if (method === "POST") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
  if (method === "DELETE") return "bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]";
  if (method === "PUT" || method === "PATCH") return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
  return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]";
}

function getSourceStyles(source: string | null) {
  if (!source || source === 'Direct') return "bg-white/5 text-white/40 border-white/10";
  if (source === 'Organic') return "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
  if (source === 'referral') return "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]";
  return "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.1)]";
}

export default function RecentVisitors({ data, isLoading, rangeLabel }: RecentVisitorsProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 bg-white/[0.02]">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 bg-white/10" />
            <Skeleton className="h-4 w-56 bg-white/10" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full bg-white/10" />
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="border-b border-white/5 p-4 flex items-center gap-4">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-6 w-16 rounded-md bg-white/10" />
                <Skeleton className="h-6 w-24 rounded-md bg-white/10" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white font-black italic uppercase tracking-tighter text-xl">Live Traffic <span className="text-primary">Feed</span></CardTitle>
          <CardDescription className="text-white/40">
            No unique visitors logged for {rangeLabel?.toLowerCase() || "the selected range"}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 bg-white/[0.02] py-4 px-6">
        <div>
          <CardTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
            Live <span className="text-primary">Access Logs</span>
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Real-time performance signals for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-white/5 border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest px-3 py-1">
            {data.length} Signals
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/20">Timestamp</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/20">Method</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/20">Route / Path</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/20 text-right">Attribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((visitor, index) => (
                <tr 
                  key={`${visitor.ip_address || "guest"}-${visitor.timestamp}-${index}`}
                  className="group hover:bg-white/[0.03] transition-all duration-200 relative"
                >
                  <td className="px-6 py-4 whitespace-nowrap relative">
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col">
                      <span className="text-[11px] font-mono font-bold text-white/60">
                        {formatAdminRelativeTime(visitor.timestamp)}
                      </span>
                      <span className="text-[9px] font-mono text-white/20">
                        {formatAdminDateTime(visitor.timestamp)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-black border",
                      getMethodStyles(visitor.method)
                    )}>
                      {visitor.method}
                    </span>
                  </td>

                  <td className="px-6 py-4 max-w-md">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-white/90 truncate" title={visitor.path}>
                          {visitor.path}
                        </span>
                        {visitor.visit_count > 1 && (
                          <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-white/30 uppercase tracking-tighter">
                            x{visitor.visit_count}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/20 font-bold uppercase tracking-widest">
                          {visitor.user__username ? (
                            <span className="flex items-center gap-1 text-primary/60">
                              <ShieldCheck className="w-3 h-3" />
                              {visitor.user__username}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserRound className="w-3 h-3" />
                              {visitor.ip_address || "GUEST"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all group-hover:scale-105",
                        getSourceStyles(visitor.source)
                      )}>
                        {visitor.source || 'Direct'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
      
      <div className="border-t border-white/5 bg-white/[0.01] p-4 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/10 italic">
          Platform Performance Monitor <span className="mx-2">|</span> End-to-End Encryption Active
        </p>
      </div>
    </Card>
  );
}
