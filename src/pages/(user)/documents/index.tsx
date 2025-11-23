import { getPurchasedTemplates } from "@/api/apiEndpoints";
import DocumentCard from "@/components/Dashboard/Documents/DocumentCard";
import IsLoading from "@/components/IsLoading";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Documents() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data, isLoading } = useQuery({
    queryKey: ["purchased-templates", currentPage, pageSize],
    queryFn: async () => {
      const response = await getPurchasedTemplates(currentPage, pageSize);
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response)) {
        return {
          results: response,
          count: response.length,
          next: null,
          previous: null,
        };
      }
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - user's documents don't change often
  });

  const documents = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-8 w-full">
      {!isLoading && (
        <div className="text-white/60 text-sm">
          {totalCount} document{totalCount !== 1 ? 's' : ''}
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
      {isLoading && <IsLoading />}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-white/60 text-sm">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white/60 text-sm px-2">
              {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
