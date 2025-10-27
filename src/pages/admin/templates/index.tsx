import { getTemplatesForAdmin } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import IsLoading from "@/components/IsLoading";
import type { Template } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Templates() {
  const { data, isLoading } = useQuery<Template[]>({
    queryFn: () => getTemplatesForAdmin(undefined),
    queryKey: ["templates"]
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-5">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Link to="?dialog=toolBuilder" className=" button rounded-none">
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map((template) => (
          <ToolCard key={template.id} tool={template} />
        ))}
      </div>
      {isLoading  && <IsLoading /> }
    </div>
  );
}
