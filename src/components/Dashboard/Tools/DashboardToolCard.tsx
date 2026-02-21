import { Eye, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Template } from "@/types";
import { useLocation, useNavigate } from "react-router-dom";
import { LazyImage } from "@/components/LazyImage";
import { motion } from "framer-motion";
import { useState } from "react";
import { BannerPreviewModal } from "@/components/BannerPreviewModal";

type Props = {
    template: Template;
};

export default function DashboardToolCard({ template }: Props) {
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const destination = `/${pathname.includes("all-tools") ? "all-tools" : "tools"}/${template.id}`;

    const handleCardClick = () => {
        setIsPreviewOpen(true);
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(destination);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                onClick={handleCardClick}
                className="relative h-[420px] rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-6 transition-all duration-500 hover:border-white/20 cursor-pointer group/card"
            >
                {/* Background Glow */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-[80px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

                {/* Preview */}
                <div
                    className="absolute inset-0 p-3 pointer-events-none z-0"
                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 95%)",
                        maskImage: "linear-gradient(to bottom, black 50%, transparent 95%)",
                    }}
                >
                    {template.banner ? (
                        <div className="h-full rounded-2xl overflow-hidden bg-black/20">
                            <LazyImage
                                src={template.banner}
                                alt={`${template.name} preview`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 bg-black/10 rounded-2xl border border-white/5 uppercase tracking-tighter font-black">
                            <Layout className="w-12 h-12" />
                        </div>
                    )}
                </div>

                {/* Top Badges */}
                <div className="absolute top-6 left-6 z-30 flex flex-col gap-2">
                    {template.hot && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                            🔥 HOT TOOL
                        </div>
                    )}
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-0 left-0 w-full z-10 p-6 pt-24 flex flex-col gap-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent">
                    <div className="space-y-2">
                        <h3 className="text-white text-xl font-black tracking-tighter truncate drop-shadow-md">
                            {template.name}
                        </h3>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleActionClick}
                            className="w-full h-11 bg-white text-black hover:bg-white/90 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-white/5"
                        >
                            <span className="flex items-center justify-center">
                                <Eye className="h-3.5 w-3.5 mr-2" />
                                Use Template
                            </span>
                        </Button>
                    </div>
                </div>
            </motion.div>

            <BannerPreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                bannerUrl={template.banner}
                templateName={template.name}
            />
        </>
    );
}
