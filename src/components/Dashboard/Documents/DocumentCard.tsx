import { Loader, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PurchasedTemplate } from "@/types";
import { Link } from "react-router-dom";
import { ConfirmAction } from "@/components/ConfirmAction";
import { deletePurchasedTemplate } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Props = {
  doc: PurchasedTemplate;
};

export default function DocumentCard({ doc }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => deletePurchasedTemplate(id),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["purchased-templates"] });
    },
  });

  const handleDelete = async () => {
    mutate(doc.id);
  };

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5">
      {/* SVG Preview */}
      <div
        className="absolute inset-0 p-2 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        {doc.svg ? (
          <div
            className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full rounded-lg overflow-hidden mask-b-to-[80%]"
            dangerouslySetInnerHTML={{ __html: doc.svg }}
            aria-label="SVG Preview"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h3 className="text-white font-semibold truncate">{doc.name}</h3>
            {doc.test && (
              <span className="text-xs text-white/80 bg-red-500 px-2 py-1 rounded-full capitalize">
                Test document
              </span>
            )}
          </div>
          <span className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded-full capitalize">
            {doc.status || "Unknown"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Link to={!isPending ? `/documents/${doc.id}` : "#"} className="">
            <Button
              disabled={isPending}
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <ConfirmAction
            trigger={
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
              >
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin " />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            }
            onConfirm={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
