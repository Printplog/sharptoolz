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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex-1 relative w-full group">
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
                      <h2 className="text-2xl font-bold text-white tracking-tight">{tool.name}</h2>
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
