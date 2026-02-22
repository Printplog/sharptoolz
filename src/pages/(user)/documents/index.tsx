import { getPurchasedTemplates } from "@/api/apiEndpoints";
import DocumentCard from "@/components/Dashboard/Documents/DocumentCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Documents() {
  const { data, isLoading } = useQuery({
    queryKey: ["purchased-templates"],
    queryFn: getPurchasedTemplates,
    staleTime: 0, // Always refetch - no caching
    gcTime: 0, // Don't keep in cache
  });

  const [searchQuery, setSearchQuery] = useState("");
  const documents = Array.isArray(data) ? data : [];

  const filteredDocuments = documents.filter((doc) =>
    doc.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
          My <span className="text-primary">Documents</span>
        </h1>
      </div>

      <div className="space-y-8 w-full">
        {!isLoading && documents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="relative flex-1 max-w-md group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 h-12 border-white/5 rounded-xl bg-white/[0.03] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div className="text-white/40 text-[11px] font-black uppercase tracking-widest shrink-0">
              {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} Found
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {filteredDocuments.map((doc) => (
            <div className="" key={doc.id}>
              <DocumentCard doc={doc} />
            </div>
          ))}
        </div>
        {!isLoading && filteredDocuments.length === 0 && (
          <div className="text-center py-20 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col items-center gap-5">
            <p className="text-white/40 italic">No documents found.</p>
            {documents.length === 0 && (
              <Link to="/tools">
                <Button className="mt-2">
                  Browse Toolz
                </Button>
              </Link>
            )}
          </div>
        )}
        {isLoading && <ToolGridSkeleton />}
      </div>
    </div>
  );
}
