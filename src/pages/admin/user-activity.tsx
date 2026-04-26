import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserActivity } from "@/api/apiEndpoints";
import { useActivitySocket, type ActivityLog } from "@/hooks/useActivitySocket";
import { format, formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  User as UserIcon, 
  Globe, 
  Clock, 
  ExternalLink,
  Search,
  Calendar as CalendarIcon,
  MousePointer2,
  Pause,
  Play,
  Users,
  AlertCircle,
  CheckCircle2,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import UserActivitySkeleton from "@/components/Admin/Layouts/UserActivitySkeleton";
import { getPresenceKey } from "@/lib/utils/presence";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";


export default function UserActivity() {
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLive, setIsLive] = useState(true);
  
  const [showAnonymous, setShowAnonymous] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  // Hook for real-time updates
  const { logs: liveLogs, presenceUpdate, initialOnlineList } = useActivitySocket();

  // Local state to track real-time presence and usernames
  const [presenceMap, setPresenceMap] = useState<Map<string, string | null>>(new Map());

  // INITIAL SYNC: When the backend sends the full list of online users with names
  useEffect(() => {
    const next = new Map<string, string | null>();
    initialOnlineList.forEach(item => {
        next.set(item.presence_key, item.username);
    });
    setPresenceMap(next);
  }, [initialOnlineList]);

  // INCREMENTAL SYNC: Update presence based on individual socket events
  useEffect(() => {
    if (presenceUpdate) {
        setPresenceMap(prev => {
            const next = new Map(prev);
            if (presenceUpdate.status === "online") {
                next.set(presenceUpdate.presence_key, presenceUpdate.username);
            } else {
                next.delete(presenceUpdate.presence_key);
            }
            return next;
        });
    }
  }, [presenceUpdate]);

  // Fetch initial/historical data
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ["userActivity", date, search],
    queryFn: () => getUserActivity({ date, search }),
    staleTime: 30000,
  });

  // Display logs: combine live events with historical snapshot
  const displayLogs = useMemo(() => {
    let rawLogs: ActivityLog[] = [];

    if (isLive && !date && !search) {
        const history = (historicalData?.results as ActivityLog[]) || [];
        const liveIds = new Set(liveLogs.map(l => l.id));
        rawLogs = [...liveLogs, ...history.filter(h => !liveIds.has(h.id))];
    } else {
        rawLogs = (historicalData?.results as ActivityLog[]) || [];
    }

    return rawLogs.filter(log => {
      const isAnonymous = !log.username;
      const isError = log.status_code && log.status_code >= 400;
      
      if (!showAnonymous && isAnonymous) return false;
      if (!showErrors && isError) return false;
      return true;
    });
  }, [liveLogs, historicalData, isLive, date, search, showAnonymous, showErrors]);

  const latestSessionMap = useMemo(() => {
    const sessionMap = new Map<string, ActivityLog>();

    displayLogs.forEach((log) => {
      const key = getPresenceKey(log) || `unknown-${log.timestamp}`;
      const existing = sessionMap.get(key);

      if (!existing) {
        sessionMap.set(key, log);
        return;
      }

      const existingTime = new Date(existing.timestamp).getTime();
      const nextTime = new Date(log.timestamp).getTime();

      if (nextTime > existingTime) {
        sessionMap.set(key, log);
      }
    });

    return sessionMap;
  }, [displayLogs]);

  const sessionResults = useMemo(
    () =>
      Array.from(latestSessionMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [latestSessionMap]
  );

  const activeSessions = useMemo(() => {
    return Array.from(presenceMap.entries())
      .map(([presenceKey, username]) => {
        const existing = latestSessionMap.get(presenceKey);
        if (existing) {
          return {
            ...existing,
            username: username || existing.username // Prefer live username
          };
        }

        return {
          id: 0,
          user: null,
          username: username,
          ip_address: null,
          session_key: null,
          visitor_id: presenceKey,
          path: "Live connection established",
          method: "WS",
          user_agent: "",
          referrer: null,
          source: null,
          medium: null,
          campaign: null,
          channel_group: null,
          source_label: null,
          status_code: 200,
          timestamp: new Date().toISOString(),
        } satisfies ActivityLog;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [latestSessionMap, presenceMap]);

  const showingLiveSessions = isLive && !date && !search;
  const visibleSessions = showingLiveSessions ? activeSessions : sessionResults;

  const stats: StatData[] = [
    {
      title: "Online",
      value: activeSessions.length.toString(),
      label: showingLiveSessions ? "Live visitors listed below" : "Live visitors online now",
      icon: Wifi,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Authenticated",
      value: visibleSessions.filter(s => !!s.username).length.toString(),
      label: showingLiveSessions ? "Logged in verified users" : "Matching logged in users",
      icon: UserIcon,
      gradient: "from-indigo-500/20 to-indigo-600/5",
      borderColor: "border-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    },
    {
      title: "Attributed",
      value: `${Math.round((displayLogs.filter(l => !!l.source && !!l.medium).length / (displayLogs.length || 1)) * 100)}%`,
      label: "Visits with source and medium",
      icon: CheckCircle2,
      gradient: "from-emerald-500/10 to-emerald-600/5",
      borderColor: "border-emerald-500/10",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Activity Hit",
      value: displayLogs.length.toString(),
      label: "Recent raw events",
      icon: MousePointer2,
      gradient: "from-accent/20 to-accent/5",
      borderColor: "border-accent/20",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    }
  ];

  if (isLoading && !historicalData) return <UserActivitySkeleton />;

  return (
    <div className="dashboard-content space-y-8 pb-24">
      {/* Page Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
              User <span className="text-primary">Activity</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-white/40 italic flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full bg-emerald-500 animate-pulse")} />
              Tracking Real-time Presence & Actions
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full mr-2">
            <button
                onClick={() => setShowAnonymous(!showAnonymous)}
                title="Toggle Guests"
                className={cn(
                    "p-2 rounded-full transition-all",
                    showAnonymous ? "bg-primary text-black" : "text-white/20 hover:text-white"
                )}
            >
                <Globe className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => setShowErrors(!showErrors)}
                title="Toggle Errors"
                className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-2",
                    showErrors 
                      ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                      : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
            >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Errors</span>
            </button>
          </div>

          <PremiumButton
            onClick={() => {
                setIsLive(!isLive);
                if (!isLive) {
                    setDate("");
                    setSearch("");
                }
            }}
            variant={isLive ? "primary" : "outline"}
            text={isLive ? "Live" : "Static"}
            icon={isLive ? Pause : Play}
            borderColor={isLive ? "border-green-500/30" : "border-white/10"}
            className={cn(
              isLive && "bg-green-500/5 text-green-500 hover:bg-green-500/10 shadow-none"
            )}
          />

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search user, ip..."
              value={search}
              onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value) setIsLive(false);
              }}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all w-40 md:w-56"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">Activity Date:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[180px] justify-start text-left font-black uppercase tracking-wider text-[10px] h-10 rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50 text-primary" />
                  {date ? format(new Date(date), "PPP") : <span>Select Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10 z-[500]" align="end">
                <Calendar 
                    mode="single" 
                    selected={date ? new Date(date) : undefined} 
                    onSelect={(d) => { 
                        if (d) {
                            setDate(format(d, "yyyy-MM-dd")); 
                            setIsLive(false);
                        }
                    }} 
                    disabled={(date) => date > new Date()}
                    initialFocus 
                    className="bg-zinc-950 text-white" 
                />
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 italic flex items-center gap-2">
                <Users className="w-4 h-4" />
                {showingLiveSessions ? "Live Visitors" : "Session Results"}
            </h3>
            <span className="text-[10px] font-mono text-white/20 uppercase">
              {showingLiveSessions
                ? `Displaying ${visibleSessions.length} currently online sessions`
                : `Displaying ${visibleSessions.length} sessions matching current filters`}
            </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {visibleSessions.length === 0 ? (
                <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-30 italic space-y-2">
                    <Activity className="w-12 h-12" />
                    <p className="text-sm font-bold uppercase tracking-widest">
                      {showingLiveSessions ? "No visitors currently online" : "No sessions found for these filters"}
                    </p>
                </div>
            ) : (
                visibleSessions.map((session, index) => (
                    <UserActivityCard 
                        key={`${session.id || "session"}-${session.visitor_id || session.timestamp}-${index}`}
                        session={session} 
                        isOnline={presenceMap.has(getPresenceKey(session) || "")}
                    />
                ))
            )}
        </div>
      </div>
    </div>
  );
}

function UserActivityCard({ session, isOnline }: { session: ActivityLog; isOnline: boolean }) {
    const isError = session.status_code && session.status_code >= 400;
    const sourceLabel = session.source_label || [session.source, session.medium].filter(Boolean).join(' / ') || 'direct / (none)';

    return (
        <div className={cn(
            "group relative border rounded-3xl p-5 transition-all duration-500 overflow-hidden shadow-2xl",
            isError ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" : "bg-[#0D0D0E] border-white/10 hover:border-primary/30"
        )}>
            {/* Background Glow */}
            <div className={cn(
                "absolute top-0 right-0 w-32 h-32 blur-[50px] -mr-16 -mt-16 rounded-full transition-all duration-500",
                isError ? "bg-red-500/5 group-hover:bg-red-500/10" : "bg-primary/5 group-hover:bg-primary/10"
            )} />
            
            <div className="relative z-10 flex items-start gap-4">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-lg",
                    session.username 
                    ? "bg-primary/10 border-primary/20 text-primary" 
                    : "bg-white/5 border-white/10 text-white/40"
                )}>
                    {session.username ? <UserIcon size={20} /> : <Globe size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors flex-1">
                            {session.username || "Anonymous Guest"}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {isOnline ? (
                                <div className="flex items-center gap-1 group/online whitespace-nowrap">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)] animate-pulse shrink-0" />
                                    <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">Live Now</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 opacity-40 whitespace-nowrap">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Recent</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] font-mono text-white/20 truncate uppercase tracking-widest leading-none">
                            {session.ip_address}
                        </p>
                        <div className={cn(
                            "px-1 py-0.5 rounded text-[7px] font-black tracking-tighter border uppercase leading-none whitespace-nowrap shrink-0",
                            isError 
                            ? "bg-red-500/20 border-red-500/30 text-red-400" 
                            : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        )}>
                            {session.status_code || "---"}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40">
                        <MousePointer2 className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Active On</p>
                        <p className={cn(
                            "text-[10px] font-mono truncate italic",
                            isError ? "text-red-400/60" : "text-white/60"
                        )}>{session.path}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40">
                        <Globe className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Discovery Source</p>
                        <p className="text-[10px] font-mono truncate italic text-primary/60">
                            {sourceLabel}
                        </p>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40">
                        <Clock className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                                Last Activity
                            </p>
                            <p className="text-[9px] font-medium text-white/40 italic">
                                {format(new Date(session.timestamp), "HH:mm:ss")}
                            </p>
                        </div>
                        <p className="text-[11px] font-medium text-white/60 italic leading-none">
                            Seen {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={cn(
                    "p-2 rounded-xl text-black",
                    isError ? "bg-red-500" : "bg-primary"
                )}>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}
