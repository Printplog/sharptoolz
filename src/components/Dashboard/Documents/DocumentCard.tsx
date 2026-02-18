import { Eye, Loader, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PurchasedTemplate } from "@/types";
import { Link } from "react-router-dom";
import { ConfirmAction } from "@/components/ConfirmAction";
import { deletePurchasedTemplate } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LazyImage } from "@/components/LazyImage";

type Props = {
  doc: PurchasedTemplate;
};

export default function DocumentCard({ doc }: Props) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (id: string) => deletePurchasedTemplate(id),
    onSuccess: () => {
      toast.success("Document deleted successfully");
      // Invalidate all purchased-templates queries (including paginated ones)
      // exact: false matches all queries that start with ["purchased-templates"]
      queryClient.invalidateQueries({
        queryKey: ["purchased-templates"],
        exact: false, // This will match ["purchased-templates", currentPage, pageSize]
      });
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const handleDelete = async () => {
    mutate(doc.id);
  };

  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-sm p-5">
      {/* Preview */}
      <div
        className="absolute inset-0 p-2 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      >
        {doc.banner ? (
          <div className="h-full rounded-lg overflow-hidden bg-black/30">
            <LazyImage
              src={doc.banner}
              alt={`${doc.name} preview`}
              className="w-full h-full"
            />
          </div>
        ) : doc.svg_url ? (
          <div className="h-full rounded-lg overflow-hidden bg-black/30">
            <LazyImage
              src={doc.svg_url}
              alt={`${doc.name} preview`}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-black/10">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 bg-transparent p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-white font-semibold truncate">{doc.name}</h3>
            <div className="flex items-center gap-2">
              {/* Red Circle for Text Mode / Test */}
              {(doc.status?.toLowerCase().includes('text') || doc.test) && (
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
              {/* Green Circle for Purchased / Paid */}
              {(!doc.test || doc.status?.toLowerCase().includes('purchased')) && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                {doc.status || (doc.test ? "Test Mode" : "Purchased")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-2">
          <Link to={!isPending ? `/documents/${doc.id}` : "#"} className="flex-1">
            <Button
              disabled={isPending}
              size="sm"
              variant="outline"
              className="w-full h-8 gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
            >
              <Eye className="h-4 w-4" />
              <span>View</span>
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
