import { useState, useEffect, useRef, useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getTemplates, getTools } from "@/api/apiEndpoints";
import { Input } from "@/components/ui/input";
import ToolGridSkeleton from "../../ToolGridSkeleton";
import DashboardToolCard from "./DashboardToolCard";
import type { Template, Tool } from "@/types";
import { Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  hot?: boolean;
}

interface GroupedTools {
  [toolId: string]: {
    tool: Tool;
    templates: Template[];
  };
}

export default function ToolsList({ hot }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const observerTarget = useRef<HTMLDivElement>(null);

  // Categories for the filter dropdown
  const { data: toolCategories, isLoading: toolsLoading } = useQuery({
    queryKey: ["tool-categories"],
    queryFn: () => getTools(),
    staleTime: 10 * 60 * 1000,
  });

  // Infinite Query for templates with backend search and category filtering
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: templatesLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["tools", { hot, search: debouncedQuery, tool: selectedTool }],
    queryFn: ({ pageParam = 1 }) => getTemplates({ 
      page: pageParam as number, 
      search: debouncedQuery, 
      tool: selectedTool, 
      hot 
    }),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        const page = url.searchParams.get("page");
        return page ? parseInt(page) : undefined;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten templates from all pages
  const templates = useMemo(() => 
    infiniteData?.pages?.flatMap(page => page.results) ?? []
  , [infiniteData]);

  const totalCount = infiniteData?.pages?.[0]?.count ?? 0;

  // Group templates by category for the regular view
  const groupedTools = useMemo(() => {
    const groups: GroupedTools = {};
    if (hot || !toolCategories || templates.length === 0) return groups;

    templates.forEach((template) => {
      const toolId = template.tool && typeof template.tool === 'object' ? template.tool.id : template.tool;
      if (toolId) {
        const toolCategory = toolCategories.find(t => t.id === toolId);
        if (toolCategory) {
          if (!groups[toolId]) {
            groups[toolId] = { tool: toolCategory, templates: [] };
          }
          groups[toolId].templates.push(template);
        }
      } else {
        if (!groups['uncategorized']) {
          groups['uncategorized'] = {
            tool: { id: 'uncategorized', name: 'Other Templates', description: 'Miscellaneous templates without a specific category.', price: 0, created_at: new Date().toISOString() },
            templates: []
          };
        }
        groups['uncategorized'].templates.push(template);
      }
    });
    return groups;
  }, [hot, toolCategories, templates]);

  const isLoading = (templatesLoading && templates.length === 0) || toolsLoading;

  return (
    <div className="space-y-10">
      {/* Search & Filter Box */}
      {!hot && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full flex-1">
            <div className="flex-1 relative w-full group max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Search for tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 h-12 border-white/5 rounded-xl bg-white/[0.03] text-white placeholder:text-white/20 focus:border-primary/50 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            <div className="w-full sm:w-auto flex gap-3">
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger className="w-full sm:w-[200px] rounded-xl bg-white/[0.03] border-white/5 text-white h-12 text-sm focus:ring-primary/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  {toolCategories?.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-white/40 text-[11px] font-black uppercase tracking-widest shrink-0 hidden md:block">
            {totalCount} tool{totalCount !== 1 ? 's' : ''} Found
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <ToolGridSkeleton />
      ) : isError ? (
        <div className="text-center py-20 border border-red-500/20 rounded-xl bg-red-500/[0.02] flex flex-col items-center gap-4">
          <p className="text-red-400 italic font-medium">Failed to load tools. Please try again.</p>
          <Button onClick={() => refetch()} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
            Retry Loading
          </Button>
        </div>
      ) : (
        <>
          {/* Hot Tools View (Flat Grid) */}
          {hot && templates.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((template) => (
                <DashboardToolCard key={template.id} template={template} />
              ))}
            </div>
          )}

          {/* Regular Tools View (Grouped by Category) */}
          {!hot && Object.keys(groupedTools).length > 0 && (
            <div className="space-y-16">
              {Object.entries(groupedTools).map(([toolId, { tool, templates }]) => (
                <div key={toolId} className="space-y-8">
                  <div className="relative pb-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{tool.name}</h2>
                      </div>
                      {tool.description && (
                        <p className="text-sm text-white/40 ml-5 italic font-medium leading-relaxed max-w-[800px]">
                          {tool.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((template) => (
                      <DashboardToolCard key={template.id} template={template} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="text-center py-20 border border-white/5 rounded-xl bg-white/[0.02] backdrop-blur-sm">
              <p className="text-white/40 italic font-medium">No tools found matching your criteria.</p>
            </div>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center w-full mt-10">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-white/40 text-sm font-medium animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Loading more tools...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
