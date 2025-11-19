import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplates, getTools } from "@/api/apiEndpoints";
import { Link, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import IsLoading from "@/components/IsLoading";
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
  const pathname = useLocation().pathname;

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["tools", `${hot && "hot"}`],
    queryFn: () => getTemplates(hot),
  });

  const { data: toolCategories, isLoading: toolsLoading } = useQuery({
    queryKey: ["tool-categories"],
    queryFn: () => getTools(),
  });

  useEffect(() => {
    if (templates) setTools(templates);
  }, [templates]);

  const filteredTools = tools.filter((tool) => {
    const matchesQuery = tool.name.toLowerCase().includes(query.toLowerCase());
    const matchesTool = selectedTool === "all" || tool.tool === selectedTool;
    return matchesQuery && matchesTool;
  });

  // Group templates by their tool category (only for non-hot tools)
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

  // Helper function to render template card
  const renderTemplateCard = (template: Template) => (
    <Link
      to={`/${pathname.includes("all-tools") ? "all-tools" : "tools"}/${
        template.id
      }`}
      key={template.id}
      className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5"
    >
      {/* Banner Preview */}
      <div
        className="absolute inset-0 p-2 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        {template.banner ? (
          <div className="mask-b-to-[80%] h-full bg-white rounded-lg overflow-hidden">
            <img
              src={template.banner}
              alt={`${template.name} banner`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold truncate">
            {template.name}
          </h3>
          <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full capitalize">
            {template?.hot ? "Hot Tool 🔥" : "Template"}
          </span>
        </div>

        <Link
          to={`/${
            pathname.includes("all-tools") ? "all-tools" : "tools"
          }/${template.id}`}
          className="w-full mt-2"
        >
          <button className="w-full px-4 py-2 rounded-md bg-primary text-background font-medium hover:bg-primary/90 transition">
            Use Template
          </button>
        </Link>
      </div>
    </Link>
  );

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
              <Button className="flex items-center gap-2 rounded-full absolute right-0 top-0 bottom-0 bg-white/10 hover:bg-white/20 text-white m-1 mr-2 px-4">
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by tool" />
              </SelectTrigger>
              <SelectContent>
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

      {/* Hot Tools - Simple Grid (No Grouping) */}
      {hot && filteredTools.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTools.map((template) => renderTemplateCard(template))}
        </div>
      )}

      {/* Regular Tools - Grouped by Category */}
      {!hot && Object.keys(groupedTools).length > 0 && (
        <div className="space-y-16">
          {Object.entries(groupedTools).map(([toolId, { tool, templates }]) => (
            <div key={toolId} className="space-y-8">
              {/* Tool Category Header */}
              <div className="relative pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-full"></div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{tool.name}</h2>
                </div>
                <div className="mt-3 h-[1px] w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {templates.map((template) => renderTemplateCard(template))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Match */}
      {filteredTools.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          No tools found.
        </p>
      )}
      
      {isLoading && <IsLoading />}
    </div>
  );
}
