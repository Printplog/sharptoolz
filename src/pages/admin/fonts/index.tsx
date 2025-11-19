import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Upload, Trash2, Download, Loader, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { addFont, deleteFont, getFonts } from "@/api/apiEndpoints";
import type { Font } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmAction } from "@/components/ConfirmAction";
import { DataTable } from "@/components/ui/data-table";

export default function AdminFontsPage() {
  const queryClient = useQueryClient();
  const [fontName, setFontName] = useState("");
  const [fontFile, setFontFile] = useState<File | null>(null);
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
      setFontName("");
      setFontFile(null);
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

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fontName.trim()) {
      toast.error("Font name is required");
      return;
    }
    if (!fontFile) {
      toast.error("Choose a font file");
      return;
    }

    const formData = new FormData();
    formData.append("name", fontName.trim());
    formData.append("font_file", fontFile);

    uploadMutation.mutate(formData);
  };

  const injectPreviewStyles = useMemo(() => {
    if (!fonts.length) return "";
    return fonts
      .filter((font) => font.font_url)
      .map(
        (font) => `
        @font-face {
          font-family: "FontPreview-${font.id}";
          src: url("${font.font_url}") format("truetype");
          font-display: swap;
        }
      `
      )
      .join("\n");
  }, [fonts]);

  useEffect(() => {
    if (!injectPreviewStyles) return;
    const styleId = "fonts-preview-style";
    if (typeof document === "undefined") return;

    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = injectPreviewStyles;

    return () => {
      if (styleEl?.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [injectPreviewStyles]);

  const resetForm = () => {
    setFontName("");
    setFontFile(null);
    setDialogOpen(false);
  };

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
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Add Font
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload a new font</DialogTitle>
                <DialogDescription>
                  Supported formats: .ttf, .otf, .woff, .woff2
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font-name">Font name</Label>
                  <Input
                    id="font-name"
                    placeholder="e.g., Inter Bold"
                    value={fontName}
                    onChange={(event) => setFontName(event.target.value)}
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-file">Font file</Label>
                  <Input
                    id="font-file"
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    onChange={(event) => {
                      setFontFile(event.target.files?.[0] || null);
                    }}
                    disabled={uploadMutation.isPending}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={uploadMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="inline-flex items-center gap-2"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload Font
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div>
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
    </div>
  );
}

