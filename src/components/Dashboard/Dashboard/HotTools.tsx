import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import ToolsList from "../Tools/ToolsList";


export default function HotTools() {
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["tools", "hot"],
    queryFn: () => getTemplates({ hot: true }),
    staleTime: 5 * 60 * 1000,
  });

  const templates = templatesData?.results || [];

  // Don't render the section at all if there are no hot tools
  if (!isLoading && (!templates || templates.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">
          Hot <span className="text-primary">Tools</span> 🔥
        </h2>
      </div>
      <ToolsList hot />
    </div>
  )
}
