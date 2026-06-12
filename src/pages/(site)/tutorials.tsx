import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SectionPadding from "@/layouts/SectionPadding";
import { Loader2, SearchIcon, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTutorials, getTools } from "@/api/apiEndpoints";
import type { Tutorial, Tool } from "@/types";
import { getYouTubeThumbnailFromUrl } from "@/lib/utils/youtube";
import { useState } from "react";
import { LazyImage } from "@/components/LazyImage";
import { DebouncedInput } from "@/components/ui/debounced-inputs";
import SEO from "@/components/SEO";

function TutorialCard({ tutorial }: { tutorial: Tutorial }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const thumbnailUrl = getYouTubeThumbnailFromUrl(tutorial.url);
  const displayTitle =
    tutorial.title || tutorial.template_name || tutorial.tool_name || "Tutorial";

  return (
    <a
      href={tutorial.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white/5 border border-white/10 rounded-lg p-1 relative group hover:border-white/20 transition-colors cursor-pointer"
    >
      {thumbnailUrl && !thumbFailed ? (
        <div className="h-60 w-full rounded-lg overflow-hidden relative">
          <LazyImage
            src={thumbnailUrl}
            alt={displayTitle}
            className="w-full h-full"
            onError={() => setThumbFailed(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-60 w-full bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 text-sm">
          No thumbnail available
        </div>
      )}
      {tutorial.is_featured && (
        <span className="absolute top-3 left-3 px-3 py-1 text-xs rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 flex items-center gap-1 backdrop-blur-sm">
          <Star className="w-3 h-3 fill-yellow-300" />
          Featured
        </span>
      )}
      <p className="text-sm text-white/80 px-3 py-5 line-clamp-2">
        {displayTitle}
      </p>
    </a>
  );
}

export default function Tutorials() {
  const [selectedToolId, setSelectedToolId] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Fetch tools for dropdown
  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: () => getTools(),
  });

  // Fetch tutorials — filtering and search are done on the backend
  const { data: tutorials, isLoading: tutorialsLoading } = useQuery<Tutorial[]>({
    queryKey: ["tutorials", selectedToolId, search],
    queryFn: () =>
      getTutorials(
        selectedToolId === "all" ? undefined : selectedToolId,
        search || undefined
      ),
  });

  const allTutorials = tutorials || [];
  const featuredTutorials = allTutorials.filter((t) => t.is_featured);
  const regularTutorials = allTutorials.filter((t) => !t.is_featured);

  return (
    <SectionPadding>
      <SEO
        title="Document Creation Tutorials"
        description="Learn how to generate professional sample documents with our step-by-step video tutorials and guides."
        canonical="/tutorials"
      />
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold pb-4 border-b border-white/10">
          Tutorials for all tools
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedToolId}
            onValueChange={setSelectedToolId}
          >
            <SelectTrigger className="w-fit min-w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select tool" className="text-white/80" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {toolsLoading ? (
                <SelectItem value="loading" disabled>Loading tools...</SelectItem>
              ) : (
                tools?.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <DebouncedInput
              value={search}
              onChange={(value) => setSearch(String(value))}
              placeholder="Search tutorials..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {tutorialsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : allTutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LazyImage
              src="/not-found.svg"
              alt="No tutorials found"
              className="w-64 h-64 -mb-3"
              placeholderColor="transparent"
            />
            <h3 className="text-xl font-semibold mb-2 text-white/90">No tutorials found</h3>
            <p className="text-white/60">
              {search
                ? "No tutorials match your search."
                : selectedToolId !== "all"
                  ? "No tutorials available for this tool yet."
                  : "No tutorials available yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {featuredTutorials.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white/90">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  Featured
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredTutorials.map((tutorial) => (
                    <TutorialCard key={tutorial.id} tutorial={tutorial} />
                  ))}
                </div>
              </div>
            )}

            {regularTutorials.length > 0 && (
              <div className="flex flex-col gap-4">
                {featuredTutorials.length > 0 && (
                  <h2 className="text-lg font-semibold text-white/90">
                    All Tutorials
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regularTutorials.map((tutorial) => (
                    <TutorialCard key={tutorial.id} tutorial={tutorial} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SectionPadding>
  );
}
