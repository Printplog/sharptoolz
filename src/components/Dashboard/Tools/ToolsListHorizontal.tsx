import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import ToolGridSkeleton from "../../ToolGridSkeleton";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import DashboardToolCard from "./DashboardToolCard";

export default function ToolsListHorizontal() {
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["tools", "hot"],
    queryFn: () => getTemplates(true),
    staleTime: 5 * 60 * 1000,
  });

  const hotTools = tools?.filter((tool) => tool.hot);
  const placeholdersCount = hotTools ? Math.max(0, 4 - hotTools.slice(0, 4).length) : 4;
  const placeholders = Array.from({ length: placeholdersCount });

  if (isLoading) {
    return (
      <div className="w-full">
        <ToolGridSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {hotTools?.map((template) => (
        <DashboardToolCard key={template.id} template={template} />
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
        <Link to="/all-tools">
          <button className="bg-white/10 hover:bg-white/15 border border-white/20 text-white flex gap-2 items-center px-8 font-bold py-3 rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500">
            All Tools
            <ArrowRight className="group-hover:translate-x-[5px] transition-all duration-500" />
          </button>
        </Link>
      </div>
    </div>
  );
}
