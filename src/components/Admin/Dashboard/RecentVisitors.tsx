"use client";

import { Activity, Clock3, ShieldCheck, UserRound } from "lucide-react";
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

function getMethodClass(method: string) {
  if (method === "POST") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (method === "DELETE") return "border-red-500/30 bg-red-500/10 text-red-300";
  if (method === "PUT" || method === "PATCH") return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  return "border-cyan-500/30 bg-cyan-500/10 text-cyan-200";
}

export default function RecentVisitors({ data, isLoading, rangeLabel }: RecentVisitorsProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 bg-white/10" />
            <Skeleton className="h-4 w-56 bg-white/10" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full bg-white/10" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl bg-white/10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-white/10" />
                    <Skeleton className="h-3 w-24 bg-white/10" />
                  </div>
                </div>
                <div className="min-w-0 flex-[1.4] space-y-2">
                  <Skeleton className="h-3 w-20 bg-white/10" />
                  <Skeleton className="h-4 w-full bg-white/10" />
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Skeleton className="h-7 w-18 rounded-full bg-white/10" />
                  <Skeleton className="h-7 w-16 rounded-full bg-white/10" />
                  <Skeleton className="h-7 w-24 rounded-full bg-white/10" />
                  <Skeleton className="h-7 w-28 rounded-full bg-white/10" />
                </div>
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
          <CardTitle className="text-white">Visitor Activity</CardTitle>
          <CardDescription className="text-white/60">
            No unique visitors logged for {rangeLabel?.toLowerCase() || "the selected range"}.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-white">Visitor Activity</CardTitle>
          <CardDescription className="text-white/60">
            Latest unique visitors for {rangeLabel?.toLowerCase() || "the selected range"}
          </CardDescription>
        </div>
        <Badge className="w-fit border-white/10 bg-white/10 text-white/75">
          {data.length} unique visitors
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((visitor, index) => (
          <div
            key={`${visitor.ip_address || "guest"}-${visitor.timestamp}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                  {visitor.user__username ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {visitor.user__username || "Guest visitor"}
                  </p>
                  <p className="truncate text-xs text-white/35">
                    {visitor.ip_address || "Unknown IP"}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] items-center uppercase tracking-wider text-white/20 font-bold">Source:</span>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                      visitor.source && visitor.source !== 'Organic' ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-white/5 text-white/40 border border-white/10"
                    )}>
                      {visitor.source || 'Direct'}
                    </span>
                  </div>

                </div>
              </div>

              <div className="min-w-0 flex-[1.4]">
                <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                  Last path
                </p>
                <p className="truncate text-sm text-white" title={visitor.path}>
                  {visitor.path}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Badge className={`border ${getMethodClass(visitor.method)}`}>
                  {visitor.method}
                </Badge>
                <Badge className="border-white/10 bg-white/5 text-white/75">
                  <Activity className="mr-1 h-3 w-3" />
                  {visitor.visit_count} hits
                </Badge>
                <Badge className="border-white/10 bg-white/5 text-white/75">
                  {visitor.user__username ? "Signed in" : "Guest"}
                </Badge>
                <Badge className="border-white/10 bg-white/5 text-white/70">
                  <Clock3 className="mr-1 h-3 w-3" />
                  {formatAdminRelativeTime(visitor.timestamp)}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-white/35 lg:text-right">
              {formatAdminDateTime(visitor.timestamp)} UTC
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
