// Admin Tools Page
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

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
import { Plus, Edit, Trash2, Loader, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import TableSkeleton from "@/components/Admin/Layouts/TableSkeleton";

export default function AdminTools() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleAddTool = () => {
    setEditingTool(null);
    setDialogOpen(true);
  };

  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setDialogOpen(true);
  };

  const handleSaveTool = (data: { name: string; description?: string; price: number }) => {
    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeleteTool = (toolId: string) => {
    setDeletingId(toolId);
    deleteMutation.mutate(toolId, {
      onSettled: () => setDeletingId(null),
    });
  };

  if (isLoading) return <TableSkeleton />;

  const columns: ColumnDef<Tool>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-semibold">{row.original.name}</div>
      ),
      filterFn: (row, _id, value) => {
        const needle = (value as string)?.toLowerCase?.() ?? "";
        if (!needle) return true;
        return (
          row.original.name.toLowerCase().includes(needle) ||
          (row.original.description ?? "").toLowerCase().includes(needle)
        );
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <div className="font-mono text-green-400">
          ${parseFloat(row.original.price.toString()).toFixed(2)}
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xl text-white/70">
          {row.original.description || (
            <span className="text-white/40 italic">No description</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="hidden md:inline text-white/60">
          {new Date(row.original.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const isDeleting =
          deletingId === row.original.id && deleteMutation.isPending;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link to={`/admin/tools/${row.original.id}/templates`}>
              <Button variant="outline" size="icon" title="View templates">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEditTool(row.original)}
              title="Edit tool"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <ConfirmAction
              title="Delete Tool"
              description={`Are you sure you want to delete "${row.original.name}"? This action cannot be undone.`}
              onConfirm={() => handleDeleteTool(row.original.id)}
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  title="Delete tool"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              }
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic flex items-center gap-2">
            Tool <span className="text-primary">Categories</span>
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

      <DataTable
        columns={columns}
        data={tools}
        filterKey="name"
        searchPlaceholder="Search tools..."
        emptyMessage="No tools created yet."
        hideColumnToggle
        selectionActions={(selectedTools, tableInstance) => {
          const ids = selectedTools.map((tool) => tool.id);
          return (
            <ConfirmAction
              title="Delete selected tools"
              description={`This will permanently delete ${ids.length} tool${ids.length === 1 ? "" : "s"
                }. Continue?`}
              onConfirm={async () => {
                for (const id of ids) {
                  await deleteMutation.mutateAsync(id);
                }
                tableInstance.resetRowSelection();
              }}
              trigger={
                <Button
                  variant="destructive"
                  size="sm"
                  className="inline-flex items-center gap-2"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </>
                  )}
                </Button>
              }
            />
          );
        }}
      />

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
