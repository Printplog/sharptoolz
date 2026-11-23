import { getFernwayAccounts, getPurchasedTemplates } from "@/api/apiEndpoints";
import DocumentCard from "@/components/Dashboard/Documents/DocumentCard";
import { FernwayMark } from "@/components/Dashboard/Tools/Fernway/FernwayLogo";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, Loader2, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: bankingSummary } = useQuery({
    queryKey: ["fernway-accounts"],
    queryFn: getFernwayAccounts,
    staleTime: 60 * 1000,
    retry: false,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ["purchased-templates", debouncedSearch],
    queryFn: ({ pageParam = 1 }) => getPurchasedTemplates({ page: pageParam, search: debouncedSearch }),
    getNextPageParam: (lastPage, allPages) => {
      // If there's a next URL, we have a next page
      if (lastPage.next) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 0,
    gcTime: 0,
    initialPageParam: 1,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const documents = data?.pages?.flatMap((page) => page?.results ?? []).filter(Boolean) ?? [];
  const totalCount = data?.pages?.[0]?.count ?? 0;



  return (
    <div className="dashboard-content space-y-6 animate-in fade-in duration-700 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tighter italic">
          My <span className="text-primary">Documents</span>
        </h1>
      </div>

      {/* Compact Online Banking shortcut */}
      <Link
        to="/online-banking"
        className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors hover:border-white/15 hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-500/12">
            <FernwayMark className="size-4 text-emerald-400" />
          </span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
            <span className="text-sm font-medium text-white">Online Banking</span>
            {(bankingSummary?.count ?? 0) > 0 && (
              <span className="text-xs text-white/45">
                {bankingSummary?.count} account{bankingSummary?.count === 1 ? "" : "s"}
              </span>
            )}
            {(bankingSummary?.pending_transfers_total ?? 0) > 0 && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                {bankingSummary?.pending_transfers_total} pending
              </span>
            )}
            {((bankingSummary?.expiring_soon_count ?? 0) + (bankingSummary?.expired_count ?? 0)) > 0 && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                Renewal due
              </span>
            )}
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-white/55 transition-colors group-hover:text-primary">
          <span className="hidden sm:inline">Open</span>
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="space-y-8 w-full">
        {(!isLoading || documents.length > 0) && (
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
            <div className="text-white/40 text-[11px] font-semibold shrink-0">
              {totalCount} document{totalCount !== 1 ? 's' : ''} Found
            </div>
          </div>
        )}

        {isLoading && documents.length === 0 ? (
          <ToolGridSkeleton />
        ) : isError ? (
          <div className="text-center py-12 border border-red-500/20 rounded-2xl bg-red-500/[0.02] flex flex-col items-center gap-4">
            <p className="text-red-400 italic text-sm">Failed to load documents. Please try refreshing.</p>
            <Button onClick={() => window.location.reload()} className="h-9 px-6 rounded-full text-[11px] font-bold bg-red-500 text-white hover:bg-red-600">
              Retry
            </Button>
          </div>
        ) : documents.length > 0 ? (

          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {documents.map((doc) => doc && (
                <div className="" key={doc.id}>
                  <DocumentCard doc={doc} />
                </div>
              ))}
            </div>

            {/* sentinel for infinite scroll */}
            <div ref={observerTarget} className="h-4 flex items-center justify-center w-full">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          </div>
        ) : !isLoading && (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.02] flex flex-col items-center gap-4">
            <p className="text-white/40 italic text-sm">No documents found.</p>
            {searchQuery === "" && (
              <Link to="/tools">
                <Button className="h-9 px-6 rounded-full text-[11px] font-bold">
                  Browse Toolz
                </Button>
              </Link>
            )}
          </div>
        )}


      </div>
    </div>
  );
}

