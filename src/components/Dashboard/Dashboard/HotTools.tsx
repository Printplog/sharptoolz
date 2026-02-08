import { useQuery } from "@tanstack/react-query";
import { getTemplates } from "@/api/apiEndpoints";
import ToolsList from "../Tools/ToolsList";

export default function HotTools() {
  const { data: templates, isLoading } = useQuery({
    queryKey: ["tools", "hot"],
    queryFn: () => getTemplates(true),
    staleTime: 5 * 60 * 1000,
  });

  // Don't render the section at all if there are no hot tools
  if (!isLoading && (!templates || templates.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl pb-3 border-b border-white/10 ">Hot Tools <span role="img" aria-label="fire">🔥</span></h2>
      <ToolsList hot />
    </div>
  )
}
