import { Loader, Pencil, Trash2, Calendar, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types";
import { useNavigate, useLocation } from "react-router-dom";
import { ConfirmAction } from "@/components/ConfirmAction";
import { deleteTemplate } from "@/api/apiEndpoints";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LazyImage } from "@/components/LazyImage";

import { useState } from "react";
import { BannerPreviewModal } from "@/components/BannerPreviewModal";

type Props = {
  tool: Template;
};

export default function ToolCard({ tool }: Props) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      toast.success("Template deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  const handleModifyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/admin/templates/${tool.id}`);
  };

  const handleDelete = async (id: string) => {
    mutate(id);
  };

  const formattedDate = tool.created_at
    ? new Date(tool.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown date';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        onClick={() => setIsPreviewOpen(true)}
        className="group relative h-[420px] rounded-[2rem] overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-3xl transition-all duration-500 hover:border-white/20 hover:bg-white/[0.05] shadow-2xl cursor-pointer"
      >
        {/* Top Badges */}
        <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
          {tool.hot && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-2xl shadow-xl shadow-orange-500/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <span className="relative z-10 text-lg">🔥</span>
            </motion.div>
          )}
          {!tool.is_active && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/40 backdrop-blur-xl border border-white/10 text-white/60 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              Draft Mode
            </motion.div>
          )}
        </div>

        {/* Banner Preview with Zoom Effect */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/95 z-10" />
          <motion.div
            className="w-full h-full"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {tool.banner ? (
              <LazyImage
                src={tool.banner}
                alt={`${tool.name} banner`}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                <Layout className="w-12 h-12 text-white/5" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Content Area */}
        <div className="absolute bottom-0 left-0 w-full z-20 p-8 space-y-4">
          <div className="space-y-1.5 transition-transform duration-500">
            <div className="flex items-center gap-2 text-white/40 text-[9px] uppercase font-black tracking-[0.2em]">
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tighter drop-shadow-2xl leading-tight truncate">
              {tool.name}
            </h3>
          </div>

          {/* Action Buttons - Always Visible */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10 transition-all duration-500">
            <div className="flex-1">
              <Button
                onClick={handleModifyClick}
                className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Modify Template
              </Button>
            </div>

            <ConfirmAction
              title="Delete Template"
              description={`Proceed to delete "${tool.name}"? This will permanently remove all associated file data.`}
              onConfirm={() => mutate(tool.id as string)}
              trigger={
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    disabled={isPending}
                    variant="ghost"
                    className="h-11 w-11 p-0 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl"
                  >
                    {isPending ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              }
              confirmText="Perm Delete"
              cancelText="Keep Safe"
            />
          </div>
        </div>

        {/* Subtle Bottom Glow on Hover */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </motion.div>

      <BannerPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        bannerUrl={tool.banner}
        templateName={tool.name}
      />
    </>
  );
}
