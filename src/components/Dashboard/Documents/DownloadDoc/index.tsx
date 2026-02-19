import * as React from "react";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { isOperaMini } from "@/lib/utils/clientDownload";
import DownloadProgress from "../DownloadProgress";
import { FormatSelector } from "./FormatSelector";
import { SideSelector } from "./SideSelector";
import { useDownloadLogic } from "./hooks/useDownloadLogic";

interface DownloadDocDialogProps {
    svg?: string;
    purchasedTemplateId?: string;
    templateName?: string;
    keywords?: string[];
    dialogName?: string;
}

export const DownloadDocDialog: React.FC<DownloadDocDialogProps> = ({
    svg,
    purchasedTemplateId,
    templateName,
    keywords = [],
    dialogName = "download-doc",
}) => {
    // 1. Identify split download capability
    const splitInfo = React.useMemo(() => {
        if (!keywords || !Array.isArray(keywords)) return { enabled: false, direction: "horizontal" as const };
        const normalizedKeywords = keywords.map(k => String(k).toLowerCase().trim().replace(/_/g, '-'));

        if (normalizedKeywords.includes("vertical-split-download")) return { enabled: true, direction: "vertical" as const };
        if (
            normalizedKeywords.includes("horizontal-split-download") ||
            normalizedKeywords.some(k => k.includes('split') && (k.includes('download') || k.includes('horizontal')))
        ) {
            return { enabled: true, direction: "horizontal" as const };
        }

        return { enabled: false, direction: "horizontal" as const };
    }, [keywords]);

    // 2. Component State
    const [type, setType] = React.useState<"pdf" | "png">("pdf");
    const [side, setSide] = React.useState<"front" | "back">("front");
    const [showProgress, setShowProgress] = React.useState(false);

    // 3. Logic Hook
    const { isGenerating, progressStep, currentSvg, handleDownload } = useDownloadLogic({
        purchasedTemplateId,
        initialSvg: svg,
        templateName,
        hasSplitDownload: splitInfo.enabled,
        splitInfo,
    });

    const onDownloadClick = async () => {
        setShowProgress(true);
        await handleDownload(type, side);
    };

    return (
        <CustomDialog dialogName={dialogName}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-black tracking-tighter text-white">Download Document</DialogTitle>
                    <DialogDescription className="text-white/50 text-xs">
                        Choose format and options for your export.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 min-h-0">
                    <div className="space-y-6">
                        {isOperaMini() && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-500 text-[10px] flex items-start gap-2 mb-2">
                                <span>⚠️</span>
                                <p><strong>Opera Mini:</strong> Using server-side fallback for reliable generation.</p>
                            </div>
                        )}

                        {/* Progress Overlay */}
                        {showProgress && (
                            <DownloadProgress
                                outputType={type}
                                isDownloading={isGenerating}
                                step={progressStep}
                                onComplete={() => setShowProgress(false)}
                            />
                        )}

                        {!showProgress && (
                            <>
                                <FormatSelector type={type} setType={setType} />

                                {splitInfo.enabled && (
                                    <SideSelector
                                        side={side}
                                        setSide={setSide}
                                        direction={splitInfo.direction}
                                        svg={currentSvg}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-white/[0.02]">
                    <Button
                        onClick={onDownloadClick}
                        disabled={isGenerating}
                        className="w-full h-12 bg-white text-black hover:bg-white/90 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-white/5"
                    >
                        {isGenerating ? "Processing..." : `Download ${splitInfo.enabled ? side : ''} ${type.toUpperCase()}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </CustomDialog>
    );
};
