import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates, getTools } from "@/api/apiEndpoints";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import ToolGridSkeleton from "../../ToolGridSkeleton";
import type { Template, Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BlurImage from "@/components/ui/BlurImage";
import { cn } from "@/lib/utils";

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
  const [tools, setTools] = useState<Template[]>([]);
  const [query, setQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const pathname = useLocation().pathname;

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["tools", `${hot && "hot"}`],
    queryFn: () => getTemplates(hot),
    staleTime: 5 * 60 * 1000,
  });

  const { data: toolCategories, isLoading: toolsLoading } = useQuery({
    queryKey: ["tool-categories"],
    queryFn: () => getTools(),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (templates) setTools(templates);
  }, [templates]);

  const filteredTools = tools.filter((tool) => {
    const matchesQuery = tool.name.toLowerCase().includes(query.toLowerCase());
    const matchesTool = selectedTool === "all" || tool.tool === selectedTool;
    return matchesQuery && matchesTool;
  });

  const groupedTools: GroupedTools = {};

  if (!hot && toolCategories && filteredTools.length > 0) {
    filteredTools.forEach((template) => {
      const toolId = template.tool;
      if (toolId) {
        const toolCategory = toolCategories.find(t => t.id === toolId);
        if (toolCategory) {
          if (!groupedTools[toolId]) {
            groupedTools[toolId] = {
              tool: toolCategory,
              templates: []
            };
          }
          groupedTools[toolId].templates.push(template);
        }
      }
    });
  }

  const isLoading = templatesLoading || toolsLoading;

  const handlePreview = (banner?: string) => {
    if (!banner) return;
    setPreviewImage(banner);
  };

  const renderTemplateCard = (template: Template) => {
    const destination = `/${pathname.includes("all-tools") ? "all-tools" : "tools"}/${template.id}`;

    return (
      <div
        key={template.id}
        className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5"
      >
        <button
          type="button"
          className="absolute inset-0 p-2 z-0 text-left"
          onClick={() => handlePreview(template.banner)}
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
        >
          {template.banner ? (
            <BlurImage
              src={template.banner}
              alt={`${template.name} banner`}
              className="h-full w-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
              No Preview
            </div>
          )}
        </button>

        <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold truncate">
              {template.name}
            </h3>
            <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full capitalize">
              {template?.hot ? "Hot Tool 🔥" : "Template"}
            </span>
          </div>

          <Link to={destination} className="w-full mt-2">
            <button className="w-full px-4 py-2 rounded-md bg-primary text-background font-medium hover:bg-primary/90 transition">
              Use Template
            </button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* Search Box */}
      {!hot && (
        <div className="flex justify-center bg-white/5 border border-white/10 px-4 py-5 rounded-lg">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <div className="flex-1 relative w-full">
              <Input
                type="text"
                placeholder="Search tools..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-5 py-3 h-fit border border-white/30 rounded-full bg-white/10 text-white placeholder:text-white/50"
              />
              <Button className="flex items-center gap-2 rounded-full absolute right-0 top-0 bottom-0 bg-white/10 hover:bg-white/20 text-white m-1 mr-2 px-4 border-0">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-full bg-white/10 border-white/30 text-white h-[48px]">
                <SelectValue placeholder="Filter by tool" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-white/10 text-white">
                <SelectItem value="all">All Tools</SelectItem>
                {toolCategories?.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <ToolGridSkeleton />
      ) : (
        <>
          {/* Hot Tools */}
          {hot && filteredTools.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredTools.map((template) => renderTemplateCard(template))}
            </div>
          )}

          {/* Regular Tools */}
          {!hot && Object.keys(groupedTools).length > 0 && (
            <div className="space-y-16">
              {Object.entries(groupedTools).map(([toolId, { tool, templates }]) => (
                <div key={toolId} className="space-y-8">
                  <div className="relative pb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full"></div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">{tool.name}</h2>
                    </div>
                    <div className="mt-3 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {templates.map((template) => renderTemplateCard(template))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Match */}
          {filteredTools.length === 0 && (
            <div className="text-center py-20 border border-white/5 rounded-xl bg-white/2">
              <p className="text-white/40 italic">No tools found matching your criteria.</p>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!previewImage}
        onOpenChange={(open) => {
          if (!open) setPreviewImage(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-black border border-white/20 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white">
              Template Preview
            </DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="w-full overflow-auto flex-1 min-h-0 custom-scrollbar">
              <BlurImage
                src={previewImage}
                alt="Template preview"
                className="h-full w-auto object-contain rounded-lg border border-white/10"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
