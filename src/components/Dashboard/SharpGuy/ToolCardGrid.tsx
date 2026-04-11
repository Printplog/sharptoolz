import { useNavigate } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";
import type { ToolCard } from "@/store/chatStore";
import { BASE_URL } from "@/api/apiClient";

interface ToolCardGridProps {
  cards: ToolCard[];
}

export default function ToolCardGrid({ cards }: ToolCardGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 w-full">
      {cards.map((tpl, i) => (
        <button
          key={tpl.id}
          onClick={() => navigate(`/tools/${tpl.id}`)}
          className="group relative rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 overflow-hidden text-left hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 focus:ring-offset-transparent"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Banner / Preview */}
          <div className="relative w-full h-[100px] overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50">
            {tpl.banner ? (
              <img
                src={
                  tpl.banner.startsWith("http")
                    ? tpl.banner
                    : `${BASE_URL}${tpl.banner}`
                }
                alt={tpl.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText size={28} className="text-white/20" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Tool name badge */}
            {tpl.toolName && (
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-medium text-white/80 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/10">
                  {tpl.toolName}
                </span>
              </div>
            )}

            {/* Price badge */}
            <div className="absolute top-2 right-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 backdrop-blur-sm px-2 py-0.5 rounded-full border border-emerald-400/20">
                ${tpl.price}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="px-2.5 py-2 flex items-center justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                {tpl.name}
              </p>
              {tpl.description && (
                <p className="text-[10px] text-white/40 truncate mt-0.5 group-hover:text-white/50 transition-colors">
                  {tpl.description}
                </p>
              )}
            </div>
            <ArrowRight
              size={12}
              className="text-white/20 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0"
            />
          </div>
        </button>
      ))}
    </div>
  );
}
