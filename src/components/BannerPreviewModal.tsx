import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LazyImage } from "@/components/LazyImage";
import { X } from "lucide-react";

interface BannerPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bannerUrl: string;
    templateName: string;
}

export function BannerPreviewModal({
    isOpen,
    onClose,
    bannerUrl,
    templateName,
}: BannerPreviewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none">
                <DialogTitle className="sr-only">{templateName} Preview</DialogTitle>
                <div className="relative w-full aspect-video md:aspect-[21/9] bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 backdrop-blur-md transition-all border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <LazyImage
                        src={bannerUrl}
                        alt={templateName}
                        className="w-full h-full object-contain md:object-cover"
                    />

                    <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/50 to-transparent">
                        <h2 className="text-2xl font-black text-white tracking-tighter drop-shadow-2xl">
                            {templateName}
                        </h2>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
