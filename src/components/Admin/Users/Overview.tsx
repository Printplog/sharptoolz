import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import type { AdminUsers } from "@/types";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface UsersOverviewProps {
  data: AdminUsers | null | undefined;
  isLoading?: boolean;
}

export default function UsersOverview({ data, isLoading }: UsersOverviewProps) {
  const [newUsersRange, setNewUsersRange] = useState("today");
  const [purchasesRange, setPurchasesRange] = useState("today");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-4 w-24 bg-white/10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-xl bg-white/10" />
            </div>
            <Skeleton className="h-10 w-20 bg-white/10 rounded-lg mb-2" />
            <Skeleton className="h-4 w-32 bg-white/5 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  const getNewUsersCount = () => {
    if (!data?.new_users) return 0;
    switch (newUsersRange) {
      case "today": return data.new_users.today;
      case "7d": return data.new_users.past_7_days;
      case "14d": return data.new_users.past_14_days;
      case "30d": return data.new_users.past_30_days;
      default: return data.new_users.today;
    }
  };

  const getPurchasesCount = () => {
    if (!data?.total_purchases_users) return 0;
    switch (purchasesRange) {
      case "today": return data.total_purchases_users.today;
      case "7d": return data.total_purchases_users.past_7_days;
      case "14d": return data.total_purchases_users.past_14_days;
      case "30d": return data.total_purchases_users.past_30_days;
      default: return data.total_purchases_users.today;
    }
  };

  const stats = [
    {
      title: "Total Registered",
      value: data?.all_users || 0,
      label: "All users",
      icon: Users,
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-400",
      trend: "+5%",
      showRange: false,
    },
    {
      title: "New Members",
      value: `+${getNewUsersCount()}`,
      label: newUsersRange === "today" ? "Today" : "Selected Period",
      icon: UserPlus,
      color: "purple",
      gradient: "from-purple-500/20 to-purple-600/5",
      borderColor: "border-purple-500/20",
      iconColor: "text-purple-400",
      range: newUsersRange,
      setRange: setNewUsersRange,
      showRange: true,
    },
    {
      title: "Active Buyers",
      value: getPurchasesCount(),
      label: "Completed orders",
      icon: DollarSign,
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      range: purchasesRange,
      setRange: setPurchasesRange,
      showRange: true,
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          className={cn(
            "relative group overflow-hidden bg-gradient-to-br border rounded-2xl p-6 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5",
            stat.gradient,
            stat.borderColor
          )}
        >
          {/* Background Decorative Element */}
          <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <stat.icon size={140} />
          </div>

          <div className="flex flex-col h-full justify-between relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">
                  {stat.title}
                </p>
                {stat.showRange && (
                  <Select value={stat.range} onValueChange={stat.setRange}>
                    <SelectTrigger className="h-7 w-fit bg-white/10 border-white/10 text-[10px] text-white/70 rounded-full px-3 py-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10 text-white min-w-[120px]">
                      <SelectItem value="today" className="text-xs">Today</SelectItem>
                      <SelectItem value="7d" className="text-xs">Past 7 days</SelectItem>
                      <SelectItem value="14d" className="text-xs">Past 14 days</SelectItem>
                      <SelectItem value="30d" className="text-xs">Past 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className={cn("p-2.5 rounded-xl bg-white/10 border border-white/10 shadow-inner", stat.iconColor)}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-white tracking-tighter">
                  {stat.value}
                </h3>
                {stat.trend && (
                  <div className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    <span>{stat.trend}</span>
                  </div>
                )}
              </div>
              <p className="text-white/40 text-xs mt-2 flex items-center gap-1.5 font-medium">
                <ArrowUpRight className="h-3 w-3" />
                {stat.label}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}