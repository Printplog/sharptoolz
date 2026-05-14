import { useEffect } from "react";
import { useUsersStore } from "@/store/usersStore";
import UsersOverview from "@/components/Admin/Users/Overview";
import UsersTable from "@/components/Admin/Users/UsersTable";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Users() {
  const { data, isLoading, error, fetchUsers, date, setDate, days, setDays } = useUsersStore();

  const RANGES = [
    { label: "1D", days: 1 },
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "6M", days: 180 },
    { label: "1Y", days: 365 },
  ] as const;

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (error) {
    return (
      <div className="dashboard-content space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <p className="text-red-400 text-center font-medium italic">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
          User <span className="text-primary">Management</span>
        </h1>

        <div className="flex flex-wrap items-center justify-end gap-3 font-bold uppercase tracking-tight">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest hidden sm:inline">Select Day:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-[180px] justify-start text-left font-black uppercase tracking-wider text-[10px] h-10 rounded-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white transition-all">
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
                  }} 
                  disabled={(date) => date > new Date()}
                  initialFocus 
                  className="bg-zinc-950 text-white" 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            {RANGES.map((option) => (
              <button
                key={option.days}
                onClick={() => setDays(option.days)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  days === option.days
                    ? 'bg-primary text-black shadow'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <UsersOverview data={data} isLoading={isLoading} />

      <UsersTable />
    </div>
  );
}
