import * as React from "react";
import { toast } from "sonner";
import { generatePdf, generatePng, triggerDownload, isOperaMini } from "@/lib/utils/clientDownload";
import type { GenerateOptions } from "@/lib/utils/clientDownload";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { injectImagesIntoSVG } from "@/lib/utils/imageInjector";
import { getPurchasedTemplate, incrementDownloads } from "@/api/apiEndpoints";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { addWatermarkToSvg, applyMaskedTestContentToSvg } from "@/lib/utils/svgWatermark";
import { BASE_URL } from "@/api/apiClient";
import type { FormField } from "@/types";

export type ProgressStep = 'idle' | 'fetching' | 'processing-patches' | 'processing-fonts' | 'processing-images' | 'rendering' | 'generating' | 'complete';

const TEST_DOWNLOAD_QUALITY_FACTOR = 0.3;

interface UseDownloadLogicProps {
    purchasedTemplateId?: string;
    initialSvg?: string;
    templateName?: string;
    hasSplitDownload: boolean;
    splitInfo: { enabled: boolean; direction: "horizontal" | "vertical" };
    fields?: FormField[];
    isTest?: boolean;
}

export const useDownloadLogic = ({
    purchasedTemplateId,
    initialSvg,
    templateName,
    hasSplitDownload,
    splitInfo,
    fields = [],
    isTest = false,
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

            // 1. Fetch SVG if missing (or if we want a fresh copy for purchased template)
            if (!workingSvg && purchasedTemplateId) {
                toast.info("Downloading document data...");
                try {
                    const data = await getPurchasedTemplate(purchasedTemplateId);

                    if (data.svg_url) {
                        const svgResponse = await fetch(data.svg_url);
                        if (!svgResponse.ok) throw new Error("Could not fetch SVG content");
                        workingSvg = await svgResponse.text();

                        setProgressStep('processing-patches');
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

                        // Inject fonts (with base64 embedding for stable PDF rendering)
                        if (data.fonts && data.fonts.length > 0) {
                            setProgressStep('processing-fonts');
                            workingSvg = await injectFontsIntoSVG(workingSvg, data.fonts, BASE_URL, true);
                        }
                    }
                } catch (fetchError) {
                    console.error("SVG fetch error:", fetchError);
                    throw new Error("Failed to retrieve document content. Please try again.");
                }
            }

            if (!workingSvg) throw new Error("Could not retrieve document content");

            // Ensure all images (including signatures) are base64-embedded
            // This is the CRITICAL STEP to match what the user sees in preview
            setProgressStep('processing-images');
            workingSvg = await injectImagesIntoSVG(workingSvg, BASE_URL);

            // 1.5 Apply watermark if this is a test document
            // If purchasedTemplateId exists, we can also check the data we might have fetched
            if (isTest) {
                workingSvg = applyMaskedTestContentToSvg(workingSvg, fields);
                workingSvg = addWatermarkToSvg(workingSvg);
            }

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

            if (isTest) {
                options.renderScaleMultiplier = TEST_DOWNLOAD_QUALITY_FACTOR;
                options.jpegQuality = TEST_DOWNLOAD_QUALITY_FACTOR;
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
            incrementDownloads().catch(() => {});

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
