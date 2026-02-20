import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2, Download, Loader, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { addFont, deleteFont, getFonts } from "@/api/apiEndpoints";
import type { Font } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ConfirmAction";
import { DataTable } from "@/components/ui/data-table";
import FontUploadDialog from "./FontUploadDialog";
import { useFontPreviewStyles } from "./useFontPreviewStyles";

export default function AdminFontsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: fonts = [],
    isLoading,
    isFetching,
  } = useQuery<Font[]>({
    queryKey: ["fonts"],
    queryFn: getFonts,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => addFont(formData),
    onSuccess: () => {
      toast.success("Font uploaded successfully");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["fonts"] });
    },
    onError: () => {
      toast.error("Failed to upload font");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFont(id),
    onSuccess: () => {
      toast.success("Font deleted");
      queryClient.invalidateQueries({ queryKey: ["fonts"] });
    },
    onError: () => {
      toast.error("Failed to delete font");
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSettled: () => setDeletingId(null),
      });
    },
    [deleteMutation]
  );

  useFontPreviewStyles(fonts);

  const columns = useMemo<ColumnDef<Font>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Font Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.name}</span>
            <span className="text-xs text-white/60">{row.original.id}</span>
          </div>
        ),
      },
      {
        id: "preview",
        header: "Preview",
        cell: ({ row }) =>
          row.original.font_url ? (
            <p
              className="text-base"
              style={{
                fontFamily: `"FontPreview-${row.original.id}", sans-serif`,
              }}
            >
              Grumpy wizards make toxic brew.
            </p>
          ) : (
            <span className="text-sm text-white/50">Upload pending</span>
          ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleString(),
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
              {row.original.font_url && (
                <a href={row.original.font_url} download>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <ConfirmAction
                title="Delete font"
                description={`"${row.original.name}" will be removed. Continue?`}
                onConfirm={() => handleDelete(row.original.id)}
                trigger={
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-200"
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
  }, [deletingId, deleteMutation.isPending, handleDelete]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Font Library</h1>
          <p className="text-white/60">
            Upload typefaces and associate them with SVG templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["fonts"] })
            }
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
          <FontUploadDialog
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            uploadMutation={uploadMutation}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={fonts}
        filterKey="name"
        searchPlaceholder="Search fonts..."
        emptyMessage="No fonts yet. Upload your first font to get started."
        isLoading={isLoading}
        hideColumnToggle
      />
    </div>
  );
}
