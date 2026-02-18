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
    <div className="relative h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-6 transition-all duration-500 hover:border-white/20 hover:scale-[1.02] group/card">
      {/* Background Glow */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

      {/* Preview */}
      <div
        className="absolute inset-0 p-3 pointer-events-none z-0"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 65%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
        }}
      >
        {doc.banner ? (
          <div className="h-full rounded-2xl overflow-hidden bg-black/20">
            <LazyImage
              src={doc.banner}
              alt={`${doc.name} preview`}
              className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
            />
          </div>
        ) : doc.svg_url ? (
          <div className="h-full rounded-2xl overflow-hidden bg-black/20">
            <LazyImage
              src={doc.svg_url}
              alt={`${doc.name} preview`}
              className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover/card:scale-105"
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 bg-black/10 rounded-2xl border border-white/5 uppercase tracking-tighter font-black">
            No Preview
          </div>
        )}
      </div>

      {/* Bottom Overlay Content */}
      <div className="absolute bottom-0 left-0 w-full z-10 p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <h3 className="text-white text-xl font-black tracking-tighter truncate drop-shadow-md">
            {doc.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              {/* Red Circle for Text Mode / Test */}
              {(doc.status?.toLowerCase().includes('text') || doc.test) && (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
              {/* Green Circle for Purchased / Paid */}
              {(!doc.test || doc.status?.toLowerCase().includes('purchased')) && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              )}
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">
                {doc.status || (doc.test ? "Test Mode" : "Purchased")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link to={!isPending ? `/documents/${doc.id}` : "#"} className="flex-1">
            <Button
              disabled={isPending}
              className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-white/5"
            >
              <Eye className="h-3.5 w-3.5 mr-2" />
              View Document
            </Button>
          </Link>
          <ConfirmAction
            trigger={
              <Button
                variant="outline"
                disabled={isPending}
                className="h-11 w-11 p-0 bg-red-500/5 border-red-500/20 text-red-500/70 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-colors"
              >
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
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
