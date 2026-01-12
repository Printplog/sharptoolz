import { Loader, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types";
import { Link, useLocation } from "react-router-dom";
import { ConfirmAction } from "@/components/ConfirmAction";
import { deleteTemplate } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import BlurImage from "@/components/ui/BlurImage";

type Props = {
  tool: Template;
};

export default function ToolCard({ tool }: Props) {
  const queryClient = useQueryClient();
  const location = useLocation();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      toast.success("Template deleted successfully");

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });

      // If we're on a tool's templates page, also invalidate that specific tool's templates
      const toolId = location.pathname.match(/\/admin\/tools\/([^\/]+)\/templates/)?.[1];
      if (toolId) {
        queryClient.invalidateQueries({ queryKey: ["templates", "tool", toolId] });
      }
    },
  });

  const handleDelete = async () => {
    mutate(tool.id as string);
  };

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5">
      {/* Banner Preview */}
      <div
        className="absolute inset-0 p-2 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        {tool.banner ? (
          <BlurImage
            src={tool.banner}
            alt={`${tool.name} banner`}
            className="w-full h-full rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold truncate">{tool.name}</h3>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Link to={`/admin/templates/${tool.id}`}>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <ConfirmAction
            title="Delete Template"
            description={`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            trigger={
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
              >
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            }
            confirmText="Delete"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
}
