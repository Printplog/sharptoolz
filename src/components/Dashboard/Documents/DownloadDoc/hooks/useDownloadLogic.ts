import * as React from "react";
import { toast } from "sonner";
import { generatePdf, generatePng, triggerDownload, isOperaMini } from "@/lib/utils/clientDownload";
import type { GenerateOptions } from "@/lib/utils/clientDownload";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { injectImagesIntoSVG } from "@/lib/utils/imageInjector";
import { getPurchasedTemplate } from "@/api/apiEndpoints";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { BASE_URL } from "@/api/apiClient";
import type { FormField } from "@/types";

export type ProgressStep = 'idle' | 'fetching' | 'processing-svg' | 'rendering' | 'generating' | 'complete';

interface UseDownloadLogicProps {
    purchasedTemplateId?: string;
    initialSvg?: string;
    templateName?: string;
    hasSplitDownload: boolean;
    splitInfo: { enabled: boolean; direction: "horizontal" | "vertical" };
}

export const useDownloadLogic = ({
    purchasedTemplateId,
    initialSvg,
    templateName,
    hasSplitDownload,
    splitInfo,
}: UseDownloadLogicProps) => {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [progressStep, setProgressStep] = React.useState<ProgressStep>('idle');
    const [currentSvg, setCurrentSvg] = React.useState<string>(initialSvg || "");

    // Update currentSvg when initialSvg changes
    React.useEffect(() => {
        if (initialSvg) setCurrentSvg(initialSvg);
    }, [initialSvg]);

    const handleDownload = async (type: "pdf" | "png", side: "front" | "back") => {
        if (!purchasedTemplateId && !currentSvg) {
            toast.error("Document data is missing");
            return;
        }

        try {
            setIsGenerating(true);
            setProgressStep('fetching');

            let workingSvg = currentSvg;

            // 1. Fetch SVG if missing
            if (!workingSvg && purchasedTemplateId) {
                toast.info("Downloading document data...");
                try {
                    const data = await getPurchasedTemplate(purchasedTemplateId);

                    if (data.svg_url) {
                        const svgResponse = await fetch(data.svg_url);
                        if (!svgResponse.ok) throw new Error("Could not fetch SVG content");
                        workingSvg = await svgResponse.text();

                        setProgressStep('processing-svg');

                        // Apply patches
                        workingSvg = applySvgPatches(workingSvg, data.svg_patches || []);

                        // Populate SVG with saved form data
                        const baseFields = data.form_fields || [];
                        const updates = data.field_updates || [];

                        const fieldsForUpdate: FormField[] = baseFields.map(field => {
                            const update = updates.find((u) => u.id === field.id);
                            return {
                                ...field,
                                currentValue: update ? (update.value as string) : field.currentValue,
                                touched: true
                            };
                        });

                        workingSvg = updateSvgFromFormData(workingSvg, fieldsForUpdate);

                        // Inject fonts
                        if (data.fonts && data.fonts.length > 0) {
                            workingSvg = await injectFontsIntoSVG(workingSvg, data.fonts, BASE_URL, true);
                        }

                        // Inject images
                        workingSvg = await injectImagesIntoSVG(workingSvg, BASE_URL);
                        setCurrentSvg(workingSvg);
                    }
                } catch (fetchError) {
                    console.error("SVG fetch error:", fetchError);
                    throw new Error("Failed to retrieve document content. Please try again.");
                }
            }

            if (!workingSvg) throw new Error("Could not retrieve document content");

            // Ensure all images are base64-embedded
            setProgressStep('processing-svg');
            workingSvg = await injectImagesIntoSVG(workingSvg, BASE_URL);

            // 2. Document generation
            toast.info(`Generating ${type.toUpperCase()}...`);
            setProgressStep('rendering');

            const options: GenerateOptions = {};
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
                    svg: workingSvg
                });
            } else {
                setProgressStep('generating');
                blob = type === "pdf"
                    ? await generatePdf(workingSvg, options)
                    : await generatePng(workingSvg, options);
            }

            // 3. Trigger download
            const sideSuffix = hasSplitDownload ? `_${side}` : "";
            const filename = templateName
                ? `${templateName}${sideSuffix}.${type}`
                : `document${sideSuffix}.${type}`;

            triggerDownload(blob, filename);

            setProgressStep('complete');
            toast.success("Download complete");

            // Reset after a delay
            setTimeout(() => setProgressStep('idle'), 2000);
        } catch (error: unknown) {
            console.error("Download failed:", error);
            const message = error instanceof Error ? error.message : "Failed to generate document";
            toast.error(message);
            setProgressStep('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        isGenerating,
        progressStep,
        currentSvg,
        handleDownload,
    };
};
