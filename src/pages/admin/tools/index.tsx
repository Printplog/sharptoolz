import { getTemplates } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Template } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tools() {
  const { data, isLoading } = useQuery<Template[]>({
    queryFn: getTemplates,
    queryKey: ["templates"]
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Tools</h1>
        <Link to="?dialog=toolBuilder" className=" button">
          <Plus className="h-4 w-4" />
          New Tool
        </Link>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
      {isLoading  && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="w-full h-[200px] bg-white/10 rounded-xl" />
       ))}
      </div>}
    </div>
  );
}

