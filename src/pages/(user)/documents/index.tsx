import { getPurchasedTemplates } from "@/api/apiEndpoints";
import DocumentCard from "@/components/Dashboard/Documents/DocumentCard";
import ToolSelector from "@/components/Dashboard/Documents/ToolSelector";
import IsLoading from "@/components/IsLoading";
import { useQuery } from "@tanstack/react-query";

export default function Documents() {
  const { data, isLoading } = useQuery({
    queryKey: ["purchased-templates"],
    queryFn: getPurchasedTemplates,
  });
  return (
    <div className="space-y-8 w-full">
      <ToolSelector />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {data?.map((doc, index) => (
          <div className="" key={index}>
            <DocumentCard doc={doc} />
          </div>
        ))}
      </div>
      {isLoading && <IsLoading />}
    </div>
  );
}
