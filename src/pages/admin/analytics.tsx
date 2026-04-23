"use client";

import { useState, useEffect, useRef } from "react";
import { getAdminAnalytics, adminOverview } from "@/api/apiEndpoints";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DollarSign, Eye, HandCoins, Users, Calendar as CalendarIcon } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import WalletFlowChart from "@/components/Admin/Dashboard/WalletFlowChart";
import VisitorChart from "@/components/Admin/Dashboard/VisitorChart";
import RecentVisitors from "@/components/Admin/Dashboard/RecentVisitors";
import DeviceStatsChart from "@/components/Admin/Dashboard/DeviceStatsChart";
import UserGrowthChart from "@/components/Admin/Dashboard/UserGrowthChart";
import DistributionChart from "@/components/Admin/Dashboard/DistributionChart";
import TopPagesChart from "@/components/Admin/Dashboard/TopPagesChart";
import SourceStatsChart from "@/components/Admin/Dashboard/SourceStatsChart";
import type { AdminOverview } from "@/types";
import AnalyticsSkeleton from "@/components/Admin/Layouts/AnalyticsSkeleton";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
] as const;

interface AnalyticsResponse {
  chart_data: Array<{
    date: string;
    total_visits: number;
    unique_visitors: number;
    total_sales: number;
    total_revenue: number;
  }>;
  recent_visitors: Array<{
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
  }>;
  device_stats: Array<{ device: string; count: number }>;
  top_pages: Array<{ path: string; visits: number }>;
  source_stats: Array<{ source: string; visits: number; unique_visitors: number }>;
  summary: {
    online_now: number;
    total_visits: number;
    unique_visitors: number;
    authenticated_visits: number;
    guest_visits: number;
    total_sales: number;
    total_revenue: number;
    conversion_rate: number;
  };
  range_days: number;
  range_label: string;
}

type ActivitySocketPayload =
  | {
      type: "new_visit";
      visitor: AnalyticsResponse["recent_visitors"][number];
    }
  | {
      type: "new_sale";
    }
  | {
      status: "online" | "offline";
    };

export default function Analytics() {
  const [days, setDays] = useState<number | null>(1);
  const [date, setDate] = useState<string>("");
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery<AnalyticsResponse>({
    queryFn: () => getAdminAnalytics(days || 1, date),
    queryKey: ["admin_analytics", date, days],
    refetchInterval: 60000, // Background poll every minute as fallback
  });

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery<AdminOverview>({
    queryFn: () => adminOverview(days || 1),
    queryKey: ["adminOverview", days],
  });

  // Advanced Realtime: WebSocket Connection
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || window.location.host;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${protocol}//${wsUrl}/ws/activity/`;

    
    const connect = () => {
        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data) as ActivitySocketPayload;
            
            if ("type" in data && data.type === "new_visit") {
                queryClient.setQueryData<AnalyticsResponse | undefined>(["admin_analytics", date, days], (old) => {
                    if (!old) return old;
                    
                    const visitors = [...(old.recent_visitors || [])];
                    const visitorId = data.visitor.visitor_id;
                    const username = data.visitor.user__username;
                    const sourceLabel = data.visitor.source_label || `${data.visitor.source || 'direct'} / ${data.visitor.medium || '(none)'}`;

                    // Group by exact user match (Username or Visitor ID)
                    const existingIdx = visitors.findIndex(v => 
                        (username && v.user__username === username) || 
                        (visitorId && v.visitor_id === visitorId)
                    );

                    let updatedVisitors;
                    if (existingIdx > -1) {
                        // Update existing person in the list
                        const existing = visitors[existingIdx];
                        visitors[existingIdx] = {
                            ...data.visitor,
                            visit_count: (existing.visit_count || 0) + 1
                        };
                        // Move to top of the list
                        const [moved] = visitors.splice(existingIdx, 1);
                        updatedVisitors = [moved, ...visitors];
                    } else {
                        // Brand new person
                        updatedVisitors = [data.visitor, ...visitors.slice(0, 23)];
                    }

                    return {
                        ...old,
                        recent_visitors: updatedVisitors,
                        summary: {
                            ...old.summary,
                            total_visits: (old.summary.total_visits || 0) + 1
                        },
                        // LIVE CHART UPDATES
                        top_pages: (() => {
                           const pages = [...(old.top_pages || [])];
                           const idx = pages.findIndex(p => p.path === data.visitor.path);
                           if (idx > -1) {
                               pages[idx] = { ...pages[idx], visits: pages[idx].visits + 1 };
                               return pages.sort((a, b) => b.visits - a.visits);
                           }
                           return [...pages, { path: data.visitor.path, visits: 1 }].sort((a, b) => b.visits - a.visits).slice(0, 6);
                        })(),
                        source_stats: (() => {
                           const sources = [...(old.source_stats || [])];
                           const sourceName = sourceLabel;
                           const idx = sources.findIndex(s => s.source === sourceName);
                           if (idx > -1) {
                               sources[idx] = { 
                                   ...sources[idx], 
                                   visits: sources[idx].visits + 1,
                                   unique_visitors: sources[idx].unique_visitors + (existingIdx > -1 ? 0 : 1)
                               };
                               return sources.sort((a, b) => b.visits - a.visits);
                           }
                           return [...sources, { source: sourceName, visits: 1, unique_visitors: 1 }].sort((a, b) => b.visits - a.visits).slice(0, 10);
                        })()
                    };
                });
            }


            if ("type" in data && data.type === "new_sale") {
                queryClient.setQueryData<AnalyticsResponse | undefined>(["admin_analytics", date, days], (old) => {
                    if (!old) return old;
                    toast.success("New Payment Received", {
                        description: `Revenue stream updated in real-time.`
                    });
                    return {
                        ...old,
                        summary: {
                            ...old.summary,
                            total_sales: (old.summary.total_sales || 0) + 1,
                        }
                    };
                });
                queryClient.invalidateQueries({ queryKey: ["admin_analytics", date, days] });
            }

            if ("status" in data && (data.status === "online" || data.status === "offline")) {
                queryClient.setQueryData<AnalyticsResponse | undefined>(["admin_analytics", date, days], (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        summary: {
                            ...old.summary,
                            online_now: data.status === "online" 
                                ? (old.summary.online_now || 0) + 1 
                                : Math.max(0, (old.summary.online_now || 0) - 1)
                        }
                    };
                });
            }
        };

        socket.onclose = () => {
            setTimeout(connect, 3000);
        };
    };

    connect();
    return () => socketRef.current?.close();
  }, [queryClient, date, days]);

  const summary = analyticsData?.summary;
  const rangeLabel = analyticsData?.range_label || "the selected range";

  const summaryCards: StatData[] = [
    {
      title: "Total Visits",
      value: summary?.total_visits ?? 0,
      label: `${rangeLabel} traffic logs`,
      icon: Eye,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-300",
    },
    {
      title: "Unique Visitors",
      value: summary?.unique_visitors ?? 0,
      label: `${summary?.authenticated_visits ?? 0} signed-in sessions`,
      icon: Users,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-300",
    },
    {
      title: "Orders",
      value: summary?.total_sales ?? 0,
      label: `${summary?.conversion_rate ?? 0}% conversion efficiency`,
      icon: HandCoins,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
    },
    {
      title: "Revenue",
      value: `$${(summary?.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      label: `Verified financial inflow`,
      icon: DollarSign,
      gradient: "from-rose-500/20 to-rose-600/5",
      borderColor: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-300",
    },
  ];

  if (isAnalyticsLoading || isOverviewLoading) return <AnalyticsSkeleton />;

  return (
    <div className="dashboard-content space-y-8 text-white">

      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Platform <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-sm font-medium text-white/40 italic">
            Focused performance signals for {rangeLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 font-bold uppercase tracking-tight">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">Select Day:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[200px] justify-start text-left font-black uppercase tracking-wider text-[10px] h-10 rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {date ? format(new Date(date), "PPP") : <span>Filter by Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10 z-[500]" align="end">
                <Calendar 
                  mode="single" 
                  selected={date ? new Date(date) : undefined} 
                  onSelect={(d) => {
                    if (d) {
                      setDate(format(d, "yyyy-MM-dd"));
                    }
                    setDays(null);
                  }} 
                  disabled={(date) => date > new Date()}
                  initialFocus 
                  className="bg-zinc-950 text-white" 
                />

              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 overflow-x-auto no-scrollbar">
            {RANGES.map((r) => (
              <button key={r.days} onClick={() => { setDays(r.days); setDate(""); }} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${days === r.days ? "bg-primary text-black" : "text-zinc-500 hover:text-white"}`}>{r.label}</button>
            ))}
          </div>
        </div>
      </div>

      <StatsCards stats={summaryCards} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <SourceStatsChart data={analyticsData?.source_stats} rangeLabel={rangeLabel} />
        <TopPagesChart data={analyticsData?.top_pages} rangeLabel={rangeLabel} />
        <VisitorChart data={analyticsData?.chart_data} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        <WalletFlowChart data={analyticsData?.chart_data} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        <DeviceStatsChart data={analyticsData?.device_stats} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
        <UserGrowthChart data={overviewData?.revenue_chart} isLoading={isOverviewLoading} rangeLabel={rangeLabel} />
        <DistributionChart data={overviewData?.documents_chart} isLoading={isOverviewLoading} />
      </div>


      <div className="mt-8">
        <RecentVisitors data={analyticsData?.recent_visitors} isLoading={isAnalyticsLoading} rangeLabel={rangeLabel} />
      </div>
    </div>
  );
}
