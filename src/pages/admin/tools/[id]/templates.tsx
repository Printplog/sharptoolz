import { getTemplatesForAdmin, getTool } from "@/api/apiEndpoints";
import ToolCard from "@/components/Admin/Tools/ToolCard";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import type { Template, Tool } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function ToolTemplates() {
  const { id } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch tool data
  const { data: tool, isLoading: toolLoading } = useQuery<Tool>({
    queryKey: ["tool", id],
    queryFn: () => getTool(id as string),
    enabled: !!id,
  });

  // Fetch templates for this tool
  const { data: templates, isLoading: templatesLoading } = useQuery<Template[]>(
    {
      queryKey: ["templates", "tool", id],
      queryFn: () => getTemplatesForAdmin(false, id as string),
      enabled: !!id,
    }
  );

  const isLoading = toolLoading || templatesLoading;

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter((template) =>
      template.name.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  if (isLoading) {
    return <ToolGridSkeleton />;
  }

  if (!tool) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Tool not found</h3>
          <p className="text-muted-foreground">
            The requested tool could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link
        to="/admin/tools"
        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors border border-white/10 rounded-full px-4 py-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
      </Link>
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div className="flex flex-col items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
              {tool.name} <span className="text-primary">Templates</span>
            </h1>
            <p className="text-white/60 mt-1">
              {tool.description || "No description available"}
            </p>
          </div>
        </div>
        <Link to="?dialog=toolBuilder" className="button rounded-none">
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Search Bar */}
      {templates && templates.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <ToolCard key={template.id} tool={template} />
          ))}
        </div>
      ) : searchQuery ? (
        <div className="text-center py-12">
          <p className="text-white/60">
            No templates found matching "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center gap-4">
          <div className="text-white/40">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No templates yet</h3>
          <p className="text-white/60 mb-4">
            This tool doesn't have any templates yet. Create first template for
            this tool.
          </p>
          <Link to="?dialog=toolBuilder" className="button w-fit rounded-none">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Link>
        </div>
      )}
    </div>
  );
}
