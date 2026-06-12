import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, Loader, Pencil, Plus, RefreshCw, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createTutorial,
  deleteTutorial,
  getTutorials,
  updateTutorial,
} from "@/api/apiEndpoints";
import type { Tutorial } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ConfirmAction";
import { DataTable } from "@/components/ui/data-table";
import TutorialDialog, {
  type TutorialFormValues,
} from "@/components/Admin/Tutorials/TutorialDialog";

const scopeLabel = (tutorial: Tutorial) => {
  if (tutorial.template) return { label: "Template", name: tutorial.template_name };
  if (tutorial.tool) return { label: "Tool", name: tutorial.tool_name };
  return { label: "General", name: undefined };
};

export default function AdminTutorialsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: tutorials = [],
    isLoading,
    isFetching,
  } = useQuery<Tutorial[]>({
    queryKey: ["adminTutorials", search],
    queryFn: () => getTutorials(undefined, search || undefined),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["adminTutorials"] });
    queryClient.invalidateQueries({ queryKey: ["tutorials"] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: TutorialFormValues) =>
      editingTutorial
        ? updateTutorial(editingTutorial.id, values)
        : createTutorial(values),
    onSuccess: () => {
      toast.success(editingTutorial ? "Tutorial updated" : "Tutorial added");
      setDialogOpen(false);
      setEditingTutorial(null);
      invalidate();
    },
    onError: (error: unknown) => {
      // Surface the OneToOne clash ("this tool/template already has a tutorial")
      const detail =
        (error as { response?: { data?: Record<string, string[]> } })?.response
          ?.data;
      const firstError = detail && Object.values(detail).flat()[0];
      toast.error(
        typeof firstError === "string" ? firstError : "Failed to save tutorial"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTutorial(id),
    onSuccess: () => {
      toast.success("Tutorial deleted");
      invalidate();
    },
    onError: () => toast.error("Failed to delete tutorial"),
  });

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteMutation.mutate(id, { onSettled: () => setDeletingId(null) });
    },
    [deleteMutation]
  );

  const openCreate = () => {
    setEditingTutorial(null);
    setDialogOpen(true);
  };

  const openEdit = useCallback((tutorial: Tutorial) => {
    setEditingTutorial(tutorial);
    setDialogOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Tutorial>[]>(() => {
    return [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.is_featured && (
              <Star className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">
                {row.original.title || "Untitled tutorial"}
              </span>
              <a
                href={row.original.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/50 hover:text-primary flex items-center gap-1"
              >
                <span className="max-w-[260px] truncate">{row.original.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </div>
        ),
      },
      {
        id: "scope",
        header: "Linked To",
        cell: ({ row }) => {
          const scope = scopeLabel(row.original);
          return (
            <div className="flex flex-col gap-1">
              <Badge
                variant="outline"
                className={
                  scope.label === "General"
                    ? "w-fit border-white/20 text-white/60"
                    : scope.label === "Tool"
                      ? "w-fit border-blue-400/30 text-blue-300"
                      : "w-fit border-primary/30 text-primary"
                }
              >
                {scope.label}
              </Badge>
              {scope.name && (
                <span className="text-xs text-white/60">{scope.name}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "is_featured",
        header: "Featured",
        cell: ({ row }) =>
          row.original.is_featured ? (
            <Badge className="bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
              Featured
            </Badge>
          ) : (
            <span className="text-white/40 text-sm">—</span>
          ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
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
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/20"
                onClick={() => openEdit(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <ConfirmAction
                title="Delete tutorial"
                description={`"${row.original.title || row.original.url}" will be removed. Continue?`}
                onConfirm={() => handleDelete(row.original.id)}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-red-500/20 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                }
              />
            </div>
          );
        },
      },
    ];
  }, [deletingId, deleteMutation.isPending, handleDelete, openEdit]);

  return (
    <div className="dashboard-content space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Tutorial <span className="text-primary">Manager</span>
          </h1>
          <p className="text-white/60">
            Manage video tutorials for tools, templates, and general guides.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={invalidate}
            disabled={isFetching}
            className="inline-flex items-center gap-2"
          >
            {isFetching ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Tutorial
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={tutorials}
        searchValue={search}
        onSearchChange={(value) => setSearch(value)}
        searchPlaceholder="Search by title, tool, or template..."
        emptyMessage="No tutorials yet. Add your first tutorial to get started."
        isLoading={isLoading}
        hideColumnToggle
        enableSelection={false}
      />

      <TutorialDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTutorial(null);
        }}
        tutorial={editingTutorial}
        onSubmit={(values) => saveMutation.mutate(values)}
        isSubmitting={saveMutation.isPending}
      />
    </div>
  );
}
