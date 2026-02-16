import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SectionPadding from "@/layouts/SectionPadding";
import { ArrowRightIcon, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTutorials, getTools } from "@/api/apiEndpoints";
import type { Tutorial, Tool } from "@/types";
import { getYouTubeThumbnailFromUrl } from "@/lib/utils/youtube";
import { useState } from "react";
import { LazyImage } from "@/components/LazyImage";

export default function Tutorials() {
  const [selectedToolId, setSelectedToolId] = useState<string>("all");

  // Fetch tools for dropdown
  const { data: tools, isLoading: toolsLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: () => getTools(),
  });

  // Fetch tutorials
  const { data: tutorials, isLoading: tutorialsLoading } = useQuery<Tutorial[]>({
    queryKey: ["tutorials", selectedToolId],
    queryFn: () => getTutorials(selectedToolId === "all" ? undefined : selectedToolId),
    enabled: true,
  });

  const filteredTutorials = tutorials || [];

  return (
    <SectionPadding>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold pb-4 border-b border-white/10">
          Tutorials for all tools
        </h1>

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

        {tutorialsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <LazyImage
              src="/not-found.svg"
              alt="No tutorials found"
              className="w-64 h-64 -mb-3"
              placeholderColor="transparent"
            />
            <h3 className="text-xl font-semibold mb-2 text-white/90">No tutorials found</h3>
            <p className="text-white/60">
              {selectedToolId !== "all" ? "No tutorials available for this tool yet." : "No tutorials available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTutorials.map((tutorial) => {
              const thumbnailUrl = getYouTubeThumbnailFromUrl(tutorial.url);
              const displayTitle = tutorial.title || (tutorial as any).template_name || "Tutorial";

              return (
                <div
                  key={tutorial.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-1 relative group hover:border-white/20 transition-colors"
                >
                  {thumbnailUrl ? (
                    <div className="h-60 w-full rounded-lg overflow-hidden relative">
                      <LazyImage
                        src={thumbnailUrl}
                        alt={displayTitle}
                        className="w-full h-full"
                        onError={(e) => {
                          // Fallback to placeholder if thumbnail fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-white/5 flex items-center justify-center text-white/40 text-sm">No thumbnail</div>';
                        }}
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
                  <p className="text-sm text-white/80 px-3 py-5 line-clamp-2">
                    {displayTitle}
                  </p>
                  <a
                    href={tutorial.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 cursor-pointer text-xs rounded-full bg-primary/5 text-primary border border-primary/10 absolute top-3 right-3 flex items-center gap-1 hover:bg-primary/10 transition-colors"
                  >
                    <span>Watch</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionPadding>
  );
}