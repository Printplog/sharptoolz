import { getTemplatesForAdmin } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import type { Template } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Layout, CheckCircle, XCircle, Flame, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Templates() {
  const { data, isLoading } = useQuery<Template[]>({
    queryFn: () => getTemplatesForAdmin(undefined),
    queryKey: ["templates"]
  })

  const total = data?.length || 0;
  const active = data?.filter(t => t.is_active).length || 0;
  const inactive = data?.filter(t => !t.is_active).length || 0;
  const hotCount = data?.filter(t => t.hot).length || 0;

  const stats = [
    {
      title: "Total Templates",
      value: total,
      icon: Layout,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      barBg: "bg-blue-500",
      border: "border-white/10",
      percentage: 100
    },
    {
      title: "Active Templates",
      value: active,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      barBg: "bg-emerald-500",
      border: "border-white/10",
      percentage: total > 0 ? Math.round((active / total) * 100) : 0
    },
    {
      title: "Hot Items",
      value: hotCount,
      icon: Flame,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      barBg: "bg-orange-500",
      border: "border-white/10",
      percentage: total > 0 ? Math.round((hotCount / total) * 100) : 0
    },
    {
      title: "Inactive/Draft",
      value: inactive,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      barBg: "bg-red-500",
      border: "border-white/10",
      percentage: total > 0 ? Math.round((inactive / total) * 100) : 0
    }
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Templates</h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">Architecting the foundation of your document toolz</p>
        </div>
        <Link
          to="?dialog=toolBuilder"
          className="group flex items-center gap-3 bg-primary text-black px-8 py-4 rounded-2xl font-black hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/30"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
          <span className="uppercase tracking-widest text-xs">New Template</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ y: -5 }}
            className={`relative overflow-hidden group p-6 rounded-[2rem] border ${stat.border} bg-white/[0.03] backdrop-blur-3xl transition-all duration-500`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

            {/* Circular Glow */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[60px] opacity-20 ${stat.bg}`} />

            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-center">
                <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} border border-white/10 shadow-inner`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <TrendingUp className={`w-3 h-3 ${stat.color}`} />
                  <span className="text-[10px] font-black text-white/60 tracking-tighter">{stat.percentage}%</span>
                </div>
              </div>

              <div>
                <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
                  {isLoading ? "0" : stat.value}
                </h3>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mt-3">
                  {stat.title}
                </p>
              </div>

              {/* Progress Detail */}
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + (index * 0.1), ease: "circOut" }}
                    className={`h-full ${stat.barBg} shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                  />
                </div>
              </div>
            </div>

            {/* Subtle Hover Glow */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr ${stat.bg.replace('/10', '/20')}`} />
          </motion.div>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-primary rounded-full" />
          <h2 className="text-xl font-bold text-white">All Templates</h2>
        </div>

        {isLoading ? (
          <ToolGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {data?.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (index * 0.05) }}
              >
                <ToolCard tool={template} />
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/2">
            <p className="text-white/40 italic text-lg">No templates found. Start by creating your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
