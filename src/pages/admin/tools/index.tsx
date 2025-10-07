// Admin Tools Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ConfirmAction } from "@/components/ConfirmAction";
import ToolDialog from "@/components/Admin/Tools/ToolDialog";
import {
  getTools,
  createTool,
  updateTool,
  deleteTool,
} from "@/api/apiEndpoints";
import type { Tool } from "@/types";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Loader,
  FolderOpen,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminTools() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  // Fetch tools
  const { data: tools = [], isLoading } = useQuery<Tool[]>({
    queryKey: ["tools"],
    queryFn: getTools,
  });

  // Create tool mutation
  const createMutation = useMutation({
    mutationFn: createTool,
    onSuccess: () => {
      toast.success("Tool created successfully!");
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
      setDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to create tool");
    },
  });

  // Update tool mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tool> }) =>
      updateTool(id, data),
    onSuccess: () => {
      toast.success("Tool updated successfully!");
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
      setDialogOpen(false);
      setEditingTool(null);
    },
    onError: () => {
      toast.error("Failed to update tool");
    },
  });

  // Delete tool mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTool,
    onSuccess: () => {
      toast.success("Tool deleted successfully!");
      // Invalidate specific queries to avoid circular re-fetching
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
    },
    onError: () => {
      toast.error("Failed to delete tool");
    },
  });

  // Filter tools based on search
  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.description &&
        tool.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTool = () => {
    setEditingTool(null);
    setDialogOpen(true);
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const handleSaveTool = (data: { name: string; description?: string }) => {
    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteTool = (toolId: string) => {
    deleteMutation.mutate(toolId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto ">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-white/60">
            <Loader className="w-5 h-5 animate-spin" />
            Loading tools...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🔧 Tools
          </h1>
          <p className="text-white/60 mt-1">
            Manage tools to organize your templates
          </p>
        </div>
        <Button onClick={handleAddTool} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Tool
        </Button>
      </div>

      {/* Search and Tools */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-2 text-white/60">
              <FolderOpen className="w-16 h-16" />
              <h3 className="text-lg font-semibold">
                {searchTerm
                  ? "No tools match your search"
                  : "No tools created yet"}
              </h3>
              {!searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTool}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Create your first tool
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className=" border border-white/10 rounded-xl p-[2px]"
              >
                <div className="relative border bg-gradient-to-b from-white/5 from-60% to-background border-white/10 rounded-xl p-4 overflow-hidden">
                  <div className="absolute w-full h-full inset-0 pointer-events-none z-10   mask-b-to-[50%]"></div>
                  <div className="pb-3 relative z-1">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {tool.name}
                    </h3>
                  </div>
                  <div className="space-y-4 relative z-1">
                    <div className="text-sm text-white/70">
                      {tool.description || (
                        <span className="text-white/40 italic">
                          No description
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-white/60">
                      Created: {new Date(tool.created_at).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2 pt-2 mt-10">
                      <Link
                        to={`/admin/tools/${tool.id}/templates`}
                        className="flex-1 w-fit"
                      >
                        <Button variant="outline" size="sm" className="">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTool(tool)}
                        className="h-8 w-8 p-0 hover:bg-white/10"
                        title="Edit tool"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <ConfirmAction
                        title="Delete Tool"
                        description={`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`}
                        onConfirm={() => handleDeleteTool(tool.id)}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-white/10"
                            title="Delete tool"
                          >
                            {deleteMutation.isPending ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool Dialog */}
      <ToolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tool={editingTool}
        onSave={handleSaveTool}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
