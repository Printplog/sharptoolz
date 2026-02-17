import { getTemplatesForAdmin } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import type { Template } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Layout, CheckCircle, XCircle, Flame, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import StatsSkeleton from "@/components/Admin/Templates/StatsSkeleton";
import { cn } from "@/lib/utils";

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery<Template[]>({
    queryFn: () => getTemplatesForAdmin(undefined),
    queryKey: ["templates"]
  })

  const filteredData = data?.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const total = data?.length || 0;
  const active = data?.filter(t => t.is_active).length || 0;
  const inactive = data?.filter(t => !t.is_active).length || 0;
  const hotCount = data?.filter(t => t.hot).length || 0;

  const stats = [
    {
      title: "Total Templates",
      value: total,
      label: "Architectural tools",
      icon: Layout,
      color: "blue",
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Active Tools",
      value: active,
      label: "Live in production",
      icon: CheckCircle,
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Hot Items",
      value: hotCount,
      label: "Most used toolz",
      icon: Flame,
      color: "orange",
      gradient: "from-orange-500/20 to-orange-600/5",
      borderColor: "border-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      title: "Inactive/Draft",
      value: inactive,
      label: "Pending tools",
      icon: XCircle,
      color: "red",
      gradient: "from-red-500/20 to-red-600/5",
      borderColor: "border-red-500/20",
      iconColor: "text-red-400",
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Templates</h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">Architecting the foundation of your document toolz</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Search templates..."
              className="pl-10 h-12 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link
            to="?dialog=toolBuilder"
            className="group flex items-center gap-3 bg-primary text-black px-6 py-3.5 rounded-2xl font-black hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="uppercase tracking-widest text-[10px]">New Template</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                <stat.icon size={120} />
              </div>

              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                      {stat.title}
                    </p>
                  </div>
                  <div className={cn("p-2.5 rounded-xl bg-white/10 border border-white/10 shadow-inner", stat.iconColor)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-4xl font-black text-white tracking-tighter">
                    {stat.value}
                  </h3>
                  <p className="text-white/40 text-[10px] mt-2 font-medium uppercase tracking-tight">
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-bold text-white">
            {searchQuery ? `Search Results (${filteredData?.length || 0})` : 'All Templates'}
          </h2>
        </div>

        {isLoading ? (
          <ToolGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredData?.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (index * 0.05) }}
              >
                <ToolCard tool={template} />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredData?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/2 backdrop-blur-sm">
            <p className="text-white/40 italic text-lg font-medium">
              {searchQuery ? `No templates match "${searchQuery}"` : "No templates found. Start by creating your first one!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
