import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserActivity } from "@/api/apiEndpoints";
import { useActivitySocket, type ActivityLog } from "@/hooks/useActivitySocket";
import { format } from "date-fns";
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
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import UserActivitySkeleton from "@/components/Admin/Layouts/UserActivitySkeleton";

export default function UserActivity() {
  const [date, setDate] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLive, setIsLive] = useState(true);

  // Hook for real-time updates
  const { logs: liveLogs } = useActivitySocket();

  // Fetch historical data if date is selected or search is active
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ["userActivity", date, search],
    queryFn: () => getUserActivity({ date, search }),
    enabled: !isLive || date !== "" || search !== "",
  });

  // Display logs: combined live and historical
  const displayLogs: ActivityLog[] = isLive && !date && !search ? (liveLogs as ActivityLog[]) : ((historicalData?.results as ActivityLog[]) || []);

  // Group logs by session/user to show "Active Users"
  const activeSessions = Array.from(new Map(displayLogs.map(l => [l.session_key || l.ip_address, l])).values());

  const stats: StatData[] = [
    {
      title: "Online Now",
      value: activeSessions.length.toString(),
      label: "Unique active sessions",
      icon: Activity,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    {
      title: "Authenticated",
      value: activeSessions.filter(s => !!s.username).length.toString(),
      label: "Logged in users",
      icon: UserIcon,
      gradient: "from-indigo-500/20 to-indigo-600/5",
      borderColor: "border-indigo-500/20",
      iconBg: "bg-indigo-500/10",
      iconColor: "text-indigo-400",
    },
    {
      title: "Guests",
      value: activeSessions.filter(s => !s.username).length.toString(),
      label: "Anonymous visitors",
      icon: Globe,
      gradient: "from-white/10 to-white/5",
      borderColor: "border-white/10",
      iconBg: "bg-white/5",
      iconColor: "text-white/40",
    },
    {
      title: "Total Hits",
      value: displayLogs.length.toString(),
      label: "Interaction count",
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
              <span className={cn("w-2 h-2 rounded-full", isLive ? "bg-emerald-500 animate-pulse" : "bg-white/20")} />
              {isLive ? "Tracking active sessions real-time" : "Viewing snapshot data"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Pause/Play Toggle */}
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

          {/* Search */}
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
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-48 md:w-64"
            />
          </div>

          {/* Date Selector */}
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

      {/* Summary Cards */}
      <StatsCards stats={stats} />

      {/* Active Users Feed (Custom Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 italic flex items-center gap-2">
                <Users className="w-4 h-4" />
                Current Active Users
            </h3>
            <span className="text-[10px] font-mono text-white/20 uppercase">Displaying {activeSessions.length} unique sessions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
            {activeSessions.length === 0 ? (
                <div className="col-span-full py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center opacity-30 italic space-y-2">
                    <Activity className="w-12 h-12" />
                    <p className="text-sm font-bold uppercase tracking-widest">No Active Sessions</p>
                </div>
            ) : (
                activeSessions.map((session) => (
                    <UserActivityCard key={session.id || session.session_key || session.timestamp} session={session} />
                ))
            )}
        </div>
      </div>
    </div>
  );
}

function UserActivityCard({ session }: { session: ActivityLog }) {
    return (
        <div className="group relative bg-[#0D0D0E] border border-white/10 rounded-3xl p-5 hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] -mr-16 -mt-16 rounded-full group-hover:bg-primary/10 transition-all duration-500" />
            
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
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                            {session.username || "Anonymous Guest"}
                        </h4>
                        <div className="flex items-center gap-1 text-emerald-400">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.5)] animate-pulse" />
                             <span className="text-[9px] font-black uppercase tracking-tighter">Live</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-mono text-white/20 mt-0.5 truncate uppercase tracking-widest">{session.ip_address}</p>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40">
                        <MousePointer2 className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Last Location</p>
                        <p className="text-[11px] font-mono text-white/60 truncate italic">{session.path}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 text-white/40">
                        <Clock className="w-3 h-3" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Last Active</p>
                        <p className="text-[11px] font-medium text-white/60 italic">{format(new Date(session.timestamp), "HH:mm:ss")}</p>
                    </div>
                </div>
            </div>

            {/* View Details overlay button icon */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-2 rounded-xl bg-primary text-black">
                    <ExternalLink className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
}
