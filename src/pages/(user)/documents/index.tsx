import { getPurchasedTemplates } from "@/api/apiEndpoints";
import DocumentCard from "@/components/Dashboard/Documents/DocumentCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function Documents() {
  const { data, isLoading } = useQuery({
    queryKey: ["purchased-templates"],
    queryFn: getPurchasedTemplates,
    staleTime: 0, // Always refetch - no caching
    gcTime: 0, // Don't keep in cache
  });

  const documents = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter uppercase italic">
          My <span className="text-primary">Documents</span>
        </h1>
      </div>

      <div className="space-y-8 w-full">
        {!isLoading && (
          <div className="text-white/60 text-sm">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {documents.map((doc) => (
            <div className="" key={doc.id}>
              <DocumentCard doc={doc} />
            </div>
          ))}
        </div>
        {!isLoading && documents.length === 0 && (
          <div className="text-center text-muted-foreground flex flex-col items-center gap-5">
            <p className="">No documents found.</p>
            <Link to="/tools">
              <Button className="mt-2">
                Browse Toolz
              </Button>
            </Link>
          </div>
        )}
        {isLoading && <ToolGridSkeleton />}
      </div>
      );
}
