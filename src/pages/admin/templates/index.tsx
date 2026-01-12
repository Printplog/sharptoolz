import { getTemplatesForAdmin } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import type { Template } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Plus, Layout, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Templates() {
  const { data, isLoading } = useQuery<Template[]>({
    queryFn: () => getTemplatesForAdmin(undefined),
    queryKey: ["templates"]
  })

  const stats = [
    {
      title: "Total Templates",
      value: data?.length || 0,
      icon: Layout,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    },
    {
      title: "Active",
      value: data?.filter(t => t.is_active).length || 0,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20"
    },
    {
      title: "Inactive",
      value: data?.filter(t => !t.is_active).length || 0,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Templates</h1>
          <p className="text-white/40 text-sm mt-1">Manage and configure your document toolz</p>
        </div>
        <Link
          to="?dialog=toolBuilder"
          className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus className="h-5 w-5" />
          <span>New Template</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden group p-6 rounded-2xl border ${stat.border} bg-white/5 backdrop-blur-md transition-all hover:bg-white/[0.07]`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white/40 text-xs font-black uppercase tracking-widest">{stat.title}</p>
                <h3 className="text-3xl font-black text-white mt-2 tracking-tight">
                  {isLoading ? "..." : stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            {/* Subtle background glow */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${stat.bg}`} />
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
