import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates, getTools } from "@/api/apiEndpoints";
import { Input } from "@/components/ui/input";
import ToolGridSkeleton from "../../ToolGridSkeleton";
import DashboardToolCard from "./DashboardToolCard";
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
      const toolId = typeof template.tool === 'object' ? template.tool.id : template.tool;
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
              {filteredTools.map((template) => (
                <DashboardToolCard key={template.id} template={template} />
              ))}
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
                    {templates.map((template) => (
                      <DashboardToolCard key={template.id} template={template} />
                    ))}
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

    </div>
  );
}
