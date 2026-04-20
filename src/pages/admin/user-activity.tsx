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
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import UserActivitySkeleton from "@/components/Admin/Layouts/UserActivitySkeleton";

export default function UserActivity() {
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLive, setIsLive] = useState(true);
  
  const [showAnonymous, setShowAnonymous] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  // Hook for real-time updates
  const { logs: liveLogs, presenceUpdate, initialOnlineList } = useActivitySocket();

  // Local state to track real-time presence
  const [onlineSessions, setOnlineSessions] = useState<Set<string>>(new Set());

  // INITIAL SYNC: When the backend sends the full list of online users
  useEffect(() => {
    if (initialOnlineList && initialOnlineList.length > 0) {
        setOnlineSessions(new Set(initialOnlineList));
    }
  }, [initialOnlineList]);

  // INCREMENTAL SYNC: Update presence based on individual socket events
  useEffect(() => {
    if (presenceUpdate) {
        setOnlineSessions(prev => {
            const next = new Set(prev);
            if (presenceUpdate.status === "online") {
                next.add(presenceUpdate.session_key);
            } else {
                next.delete(presenceUpdate.session_key);
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

  // Active Sessions calculation using TRUE Real-time presence
  // FILTERED TO SHOW ONLY ONLINE PEOPLE (as requested)
  const activeSessions = useMemo(() => {
      // Map logs to unique sessions (by key or IP)
      const sessionMap = new Map<string, ActivityLog>();
      
      displayLogs.forEach(log => {
          const key = log.session_key || log.ip_address || `unknown-${log.timestamp}`;
          if (!sessionMap.has(key)) {
              sessionMap.set(key, log);
          }
      });

      return Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [displayLogs]);

  const stats: StatData[] = [
    {
      title: "Online",
      value: onlineSessions.size.toString(),
      label: "Live visitors",
      icon: Wifi,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Authenticated",
      value: activeSessions.filter(s => !!s.username).length.toString(),
      label: "Logged in verified users",
      icon: UserIcon,
      gradient: "from-indigo-500/20 to-indigo-600/5",
      borderColor: "border-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    },
    {
      title: "Success Rate",
      value: `${Math.round((displayLogs.filter(l => !l.status_code || l.status_code < 400).length / (displayLogs.length || 1)) * 100)}%`,
      label: "Interaction health",
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
                title="Toggle Error Logs"
                className={cn(
                    "p-2 rounded-full transition-all flex items-center gap-2 px-3",
                    showErrors ? "bg-red-500 text-white" : "text-white/20 hover:text-white"
                )}
            >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Errors</span>
            </button>
          </div>

          <button
            onClick={() => {
                setIsLive(!isLive);
                if (!isLive) {
                    setDate("");
                    setSearch("");
                }
            }}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border shadow-sm",
                isLive 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            )}
          >
            {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isLive ? "Live" : "Static"}
          </button>

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

          <div className="relative group">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 group-focus-within:text-primary transition-colors" />
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (e.target.value) setIsLive(false);
              }}
              className="pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white focus:outline-none focus:border-primary/50 cursor-pointer transition-all"
            />
          </div>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 italic flex items-center gap-2">
                <Users className="w-4 h-4" />
                Recent Visitor Hits
            </h3>
            <span className="text-[10px] font-mono text-white/20 uppercase">Displaying {activeSessions.length} recent unique sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {activeSessions.length === 0 ? (
                <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-30 italic space-y-2">
                    <Activity className="w-12 h-12" />
                    <p className="text-sm font-bold uppercase tracking-widest">No visitors currently online</p>
                </div>
            ) : (
                activeSessions.map((session) => (
                    <UserActivityCard 
                        key={session.id || session.session_key || session.timestamp} 
                        session={session} 
                        isOnline={onlineSessions.has(session.session_key || "")}
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
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                            {session.username || "Anonymous Guest"}
                        </h4>
                        
                        <div className="flex items-center gap-1.5">
                            {isOnline ? (
                                <div className="flex items-center gap-1 group/online">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)] animate-pulse" />
                                    <span className="text-[8px] font-black uppercase text-emerald-400">Live</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 opacity-40">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                    <span className="text-[8px] font-black uppercase text-white/40">Recent</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] font-mono text-white/20 truncate uppercase tracking-widest leading-none">
                            {session.ip_address}
                        </p>
                        <div className={cn(
                            "px-1 py-0.5 rounded text-[7px] font-black tracking-tighter border uppercase leading-none",
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
                        <Clock className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                                Online Session
                            </p>
                            <p className="text-[9px] font-medium text-white/40 italic">
                                {format(new Date(session.timestamp), "HH:mm:ss")}
                            </p>
                        </div>
                        <p className="text-[11px] font-medium text-white/60 italic leading-none">
                            Active {formatDistanceToNow(new Date(session.timestamp), { addSuffix: true })}
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
