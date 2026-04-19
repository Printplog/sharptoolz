"use client";

import { Activity, Clock3, Globe2, Route, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAdminDateTime, formatAdminRelativeTime } from "@/lib/utils/adminDate";

interface Visitor {
  ip_address: string | null;
  path: string;
  timestamp: string;
  user__username: string | null;
  method: string;
  visit_count: number;
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
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-6 w-20 rounded-full bg-white/10" />
              </div>
              <Skeleton className="h-5 w-3/4 bg-white/10" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-14 bg-white/10 rounded-xl" />
                <Skeleton className="h-14 bg-white/10 rounded-xl" />
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
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {data.map((visitor, index) => (
          <div
            key={`${visitor.ip_address || "guest"}-${visitor.timestamp}-${index}`}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
                      {visitor.user__username ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {visitor.user__username || "Guest visitor"}
                      </p>
                      <p className="truncate text-xs text-white/35">
                        {visitor.ip_address || "Unknown IP"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-semibold text-white/70">
                    {formatAdminRelativeTime(visitor.timestamp)}
                  </p>
                  <p className="text-[11px] text-white/35">
                    {formatAdminDateTime(visitor.timestamp)} UTC
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                  <Route className="h-3 w-3" />
                  Last Path
                </div>
                <p className="truncate text-sm text-white" title={visitor.path}>
                  {visitor.path}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                    <Activity className="h-3 w-3" />
                    Hits
                  </p>
                  <p className="text-lg font-bold text-white">{visitor.visit_count}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                    <Clock3 className="h-3 w-3" />
                    Method
                  </p>
                  <Badge className={`border ${getMethodClass(visitor.method)}`}>
                    {visitor.method}
                  </Badge>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/35">
                    <Globe2 className="h-3 w-3" />
                    Type
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {visitor.user__username ? "Signed in" : "Guest"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
