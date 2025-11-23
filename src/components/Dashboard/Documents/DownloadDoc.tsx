import * as React from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CustomDialog } from "@/components/ui/CustomDialog";
import { useMutation } from "@tanstack/react-query";
import type { DownloadData } from "@/types";
import { downloadDoc } from "@/api/apiEndpoints";
import errorMessage from "@/lib/utils/errorMessage";
import DownloadProgress from "./DownloadProgress";

interface DownloadDocDialogProps {
  svg?: string; // Optional - kept for backward compatibility but not sent to backend
  purchasedTemplateId?: string;
  templateName?: string;
  keywords?: string[]; // Template keywords to check for split download
}

export const DownloadDocDialog: React.FC<DownloadDocDialogProps> = ({
  svg,
  purchasedTemplateId,
  templateName,
  keywords = [],
}) => {
  const [type, setType] = React.useState<"pdf" | "png">("pdf");
  const [side, setSide] = React.useState<"front" | "back">("front");
  
  // Check if split download is enabled
  const hasSplitDownload = React.useMemo(() => {
    const normalizedKeywords = keywords.map(k => String(k).toLowerCase().trim());
    return normalizedKeywords.includes("vertical-split-download") || 
           normalizedKeywords.includes("horizontal-split-download") ||
           normalizedKeywords.includes("split-download");
  }, [keywords]);

  const [showProgress, setShowProgress] = React.useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: DownloadData) => downloadDoc(data),

    onSuccess: async (blob) => {
      // Normal single file download (now handles split downloads as single files)
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const sideSuffix = hasSplitDownload ? `_${side}` : "";
      link.download = templateName 
        ? `${templateName}${sideSuffix}.${type}` 
        : `document${sideSuffix}.${type}`;
      link.href = url;
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setShowProgress(false);
      toast.success("Download complete");
    },

    onError: (error: Error) => {
      setShowProgress(false);
      toast.error(errorMessage(error));
    },
  });

  const handleDownload = () => {
    if (!purchasedTemplateId) {
      toast.error("Document ID is required for download");
      return;
    }
    setShowProgress(true);
    // Optimize: Don't send SVG in request - backend will fetch it from purchased_template_id
    // This significantly reduces request payload size
    mutate({ 
      type, 
      purchased_template_id: purchasedTemplateId as string, // Type assertion since we checked above
      template_name: templateName,
      side: hasSplitDownload ? side : undefined
    });
  };

  return (
    <CustomDialog dialogName="download-doc">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Document</DialogTitle>
          <DialogDescription>
            Choose the format and download your document.
          </DialogDescription>
        </DialogHeader>

        {!isPending && (
          <div className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Format</Label>
              <RadioGroup
                value={type}
                onValueChange={(val) => setType(val as "pdf" | "png")}
                className="space-y-3"
              >
                <label
                  htmlFor="pdf"
                  className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${
                    type === "pdf" ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="cursor-pointer flex-1">PDF (High quality vector)</Label>
                </label>
                <label
                  htmlFor="png"
                  className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${
                    type === "png" ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png" className="cursor-pointer flex-1">PNG (Image export)</Label>
                </label>
              </RadioGroup>
            </div>

            {/* Side Selection (only for split downloads) */}
            {hasSplitDownload && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Side</Label>
                <RadioGroup
                  value={side}
                  onValueChange={(val) => setSide(val as "front" | "back")}
                  className="space-y-3"
                >
                  <label
                    htmlFor="front"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${
                      side === "front" ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <RadioGroupItem value="front" id="front" />
                    <Label htmlFor="front" className="cursor-pointer flex-1">Front (First Half)</Label>
                  </label>
                  <label
                    htmlFor="back"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${
                      side === "back" ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <RadioGroupItem value="back" id="back" />
                    <Label htmlFor="back" className="cursor-pointer flex-1">Back (Second Half)</Label>
                  </label>
                </RadioGroup>
              </div>
            )}
          </div>
        )}

        {/* Download Progress */}
        {showProgress && (
          <div className="pt-4">
            <DownloadProgress
              svg={svg}
              outputType={type}
              isDownloading={isPending}
              onComplete={() => setShowProgress(false)}
            />
          </div>
        )}

        <DialogFooter>
          <Button 
            onClick={handleDownload}
            disabled={isPending}
          >
            {isPending 
              ? "Downloading..." 
              : hasSplitDownload 
                ? `Download ${side} as ${type.toUpperCase()}`
                : `Download as ${type.toUpperCase()}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </CustomDialog>
  );
};
