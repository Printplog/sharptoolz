import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import ToolGridSkeleton from "../../ToolGridSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import DashboardToolCard from "./DashboardToolCard";
import { PremiumButton } from "@/components/ui/PremiumButton";


export default function ToolsListHorizontal() {
  const { data: toolsData, isLoading } = useQuery({
    queryKey: ["tools", "hot"],
    queryFn: () => getTemplates({ hot: true }),
    staleTime: 5 * 60 * 1000,
  });

  const tools = toolsData?.results || [];
  const hotTools = tools.filter((tool) => tool.hot) || [];
  const placeholdersCount = Math.max(0, 4 - hotTools.slice(0, 4).length);
  const placeholders = Array.from({ length: placeholdersCount });

  if (isLoading) {
    return (
      <div className="w-full">
        <ToolGridSkeleton />
      </div>
    );
  }

  if (hotTools.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-14 px-10 rounded-[40px] bg-white/2 border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/2 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 w-full justify-center">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-all duration-500">
               <ArrowRight className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors -rotate-45" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none">
                Spotlight <span className="text-primary/80">Empty</span>
              </h3>
            </div>
          </div>

          <div className="hidden md:block w-px h-10 bg-white/5" />

          <p className="text-white/30 text-xs font-medium max-w-[240px] text-center md:text-left leading-relaxed">
            No featured tools today, but our full library is active and ready for you.
          </p>

          <PremiumButton 
            text="Explore Tools" 
            icon={ArrowRight} 
            href="/all-tools" 
            variant="ghost" 
            className="min-w-[180px]"
            noShadow={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {hotTools.map((template, index) => (
        <DashboardToolCard key={template.id} template={template} delay={index * 0.1} />
      ))}

      {placeholders.map((_, index) => (
        <div
          key={`placeholder-${index}`}
          className="relative h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-2 w-full"
        >
          <Skeleton className="w-full h-full bg-white/5 rounded-2xl" />
        </div>
      ))}

      {/* All Tools Button */}
      <div className="col-span-full flex justify-center mt-8">
        <PremiumButton 
          text="All Tools" 
          icon={ArrowRight} 
          href="/all-tools" 
          variant="ghost" 
          className="min-w-[180px]"
          noShadow={true}
        />
      </div>
    </div>
  );
}
