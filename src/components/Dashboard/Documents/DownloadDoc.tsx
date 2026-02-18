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
import { generatePdf, generatePng, triggerDownload, isOperaMini } from "@/lib/utils/clientDownload";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { injectImagesIntoSVG } from "@/lib/utils/imageInjector";
import { getPurchasedTemplate } from "@/api/apiEndpoints";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import DownloadProgress from "./DownloadProgress";
import { BASE_URL } from "@/api/apiClient";
import type { FormField } from "@/types";

interface DownloadDocDialogProps {
  svg?: string; // Optional - kept for backward compatibility but not sent to backend
  purchasedTemplateId?: string;
  templateName?: string;
  keywords?: string[]; // Template keywords to check for split download
  dialogName?: string;
}

export const DownloadDocDialog: React.FC<DownloadDocDialogProps> = ({
  svg,
  purchasedTemplateId,
  templateName,
  keywords = [],
  dialogName = "download-doc",
}) => {
  // Check if split download is enabled and get direction
  const splitInfo = React.useMemo(() => {
    if (!keywords || !Array.isArray(keywords)) return { enabled: false, direction: "horizontal" as const };

    const normalizedKeywords = keywords.map(k => String(k).toLowerCase().trim().replace(/_/g, '-'));

    if (normalizedKeywords.includes("vertical-split-download")) {
      return { enabled: true, direction: "vertical" as const };
    }
    if (
      normalizedKeywords.includes("horizontal-split-download") ||
      normalizedKeywords.includes("split-download") ||
      normalizedKeywords.some(k => k.includes('split') && (k.includes('download') || k.includes('horizontal')))
    ) {
      return { enabled: true, direction: "horizontal" as const };
    }

    // Secondary check for vertical split in custom keywords
    if (normalizedKeywords.some(k => k.includes('split') && k.includes('vertical'))) {
      return { enabled: true, direction: "vertical" as const };
    }

    return { enabled: false, direction: "horizontal" as const };
  }, [keywords]);

  const hasSplitDownload = splitInfo.enabled;

  const [type, setType] = React.useState<"pdf" | "png">("pdf");
  const [side, setSide] = React.useState<"front" | "back">("front");

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showProgress, setShowProgress] = React.useState(false);
  const [currentSvg, setCurrentSvg] = React.useState<string>(svg || "");

  // Update currentSvg when prop changes (e.g. from FormPanel)
  React.useEffect(() => {
    if (svg) {
      setCurrentSvg(svg);
    }
  }, [svg]);

  const handleDownload = async () => {
    if (!purchasedTemplateId && !svg) {
      toast.error("Document data is missing");
      return;
    }

    try {
      setIsGenerating(true);
      setShowProgress(true);

      let workingSvg = currentSvg;

      // 1. Fetch SVG if missing
      if (!workingSvg && purchasedTemplateId) {
        toast.info("Downloading...");
        try {
          // Use our existing API endpoint wrapper
          const data = await getPurchasedTemplate(purchasedTemplateId);

          if (data.svg_url) {
            // Attempt to fetch the SVG content
            const svgResponse = await fetch(data.svg_url);
            if (!svgResponse.ok) throw new Error("Could not fetch SVG content");
            workingSvg = await svgResponse.text();

            // Apply patches if it's not already patched
            workingSvg = applySvgPatches(workingSvg, data.svg_patches || []);

            // Populate SVG with saved form data (Preserving metadata like rotation/type)
            const baseFields = data.form_fields || [];
            const updates = data.field_updates || [];

            const fieldsForUpdate: FormField[] = baseFields.map(field => {
              const update = updates.find((u: any) => u.id === field.id);
              return {
                ...field,
                currentValue: update ? (update.value as any) : field.currentValue,
                touched: true // Ensure the value is applied during patch
              };
            });

            workingSvg = updateSvgFromFormData(workingSvg, fieldsForUpdate);

            // Inject fonts (with base64 embedding for downloads)
            if (data.fonts && data.fonts.length > 0) {
              workingSvg = await injectFontsIntoSVG(workingSvg, data.fonts, BASE_URL, true);
            }

            // Inject images (base64 embedding required for native canvas rendering)
            workingSvg = await injectImagesIntoSVG(workingSvg, BASE_URL);

            setCurrentSvg(workingSvg);
          }
        } catch (fetchError) {
          console.error("SVG fetch error:", fetchError);
          // If direct fetch fails (CORS?), we might need a fallback, 
          // but for now let's expose the error so the user knows why it failed.
          throw new Error("Failed to retrieve document content. Please try again.");
        }
      }


      if (!workingSvg) throw new Error("Could not retrieve document content");

      // Ensure all images are base64-embedded for native rendering compatibility
      workingSvg = await injectImagesIntoSVG(workingSvg, BASE_URL);

      // 2. Generate side-specific SVG if needed (simulated for now as we don't have the server-side split logic here)
      // In a real scenario, we might need a utility to split the SVG client-side

      // 3. Document generation
      toast.info(`Downloading ${type.toUpperCase()}...`);

      const options: any = {};
      if (hasSplitDownload) {
        options.split = {
          direction: splitInfo.direction,
          side: side
        };
      }

      let blob: Blob;

      if (isOperaMini()) {
        const { downloadDoc } = await import("@/api/apiEndpoints");
        blob = await downloadDoc({
          purchased_template_id: purchasedTemplateId as string,
          type: type,
          side: hasSplitDownload ? side : undefined,
          svg: workingSvg // Pass the working SVG with injected data
        });
      } else {
        blob = type === "pdf"
          ? await generatePdf(workingSvg, options)
          : await generatePng(workingSvg, options);
      }

      // 4. Trigger download
      const sideSuffix = hasSplitDownload ? `_${side}` : "";
      const filename = templateName
        ? `${templateName}${sideSuffix}.${type}`
        : `document${sideSuffix}.${type}`;

      triggerDownload(blob, filename);

      toast.success("Download complete");
    } catch (error: any) {
      console.error("Download failed:", error);
      toast.error(error.message || "Failed to generate document");
    } finally {
      setIsGenerating(false);
      setShowProgress(false);
    }
  };


  return (
    <CustomDialog dialogName={dialogName}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Download Document</DialogTitle>
          <DialogDescription>
            Choose the format and download your document.
          </DialogDescription>
        </DialogHeader>

        {isOperaMini() && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-500 text-xs flex items-start gap-2 mb-4">
            <span className="mt-0.5">⚠️</span>
            <p>
              <strong>Opera Mini Detected:</strong> Client-side generation may not work in "Extreme" mode. Please use "High" mode or a different browser for the best experience.
            </p>
          </div>
        )}

        {!isGenerating && (
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
                  className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${type === "pdf" ? "border-primary bg-primary/10" : ""
                    }`}
                >
                  <RadioGroupItem value="pdf" id="pdf" />
                  <Label htmlFor="pdf" className="cursor-pointer flex-1">PDF (High quality vector)</Label>
                </label>
                <label
                  htmlFor="png"
                  className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${type === "png" ? "border-primary bg-primary/10" : ""
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
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${side === "front" ? "border-primary bg-primary/10" : ""
                      }`}
                  >
                    <RadioGroupItem value="front" id="front" />
                    <Label htmlFor="front" className="cursor-pointer flex-1">Front (First Half)</Label>
                  </label>
                  <label
                    htmlFor="back"
                    className={`flex items-center space-x-3 border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer transition-colors hover:bg-white/10 ${side === "back" ? "border-primary bg-primary/10" : ""
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
              svg={svg || currentSvg}
              outputType={type}
              isDownloading={isGenerating}
              onComplete={() => setShowProgress(false)}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating
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
