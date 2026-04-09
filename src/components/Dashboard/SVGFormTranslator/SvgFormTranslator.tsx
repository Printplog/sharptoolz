// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useRef, useMemo } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { injectImagesIntoSVG } from "@/lib/utils/imageInjector";
import { BASE_URL } from "@/api/apiClient";
import { addWatermarkToSvg } from "@/lib/utils/svgWatermark";
import {
  sanitizeSvgGradients,
  svgNamespace,
} from "@/lib/utils/sanitizeSvgGradients";
import { generateAutoFields } from "@/lib/utils/fieldGenerator";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import {
  getPurchasedTemplate,
  getTemplate,
  getTemplateSvgForAdmin,
} from "@/api/apiEndpoints";
import type { FormField, PurchasedTemplate, Template } from "@/types";
import SvgFormTranslatorSkeleton from "./SvgFormTranslatorSkeleton";
import PreviewSkeleton from "./PreviewSkeleton";
import parseSvgElements from "@/lib/utils/parseSvgElements";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import { toast } from "sonner";
import { getAdaptiveDebounce } from "@/lib/utils/deviceDetection";

// Component to render action buttons by cloning and connecting to FormPanel buttons
function ActionButtonsRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cloneButtons = () => {
      const formPanel = document.querySelector("[data-form-panel-user]");
      const targetContainer = containerRef.current;

      if (!formPanel || !targetContainer) return;

      // Find the buttons container in FormPanel
      const buttonsContainer = formPanel.querySelector(
        "div.pt-4.border-t.border-white\\/20.flex:last-child",
      ) as HTMLElement;
      if (!buttonsContainer) return;

      // Get all buttons from FormPanel
      const originalButtons = buttonsContainer.querySelectorAll("button, a");

      // Clear existing content
      targetContainer.innerHTML = "";

      // Clone each button and connect click handlers
      originalButtons.forEach((originalBtn) => {
        const cloned = originalBtn.cloneNode(true) as HTMLElement;

        // Preserve all attributes and styles
        if (originalBtn instanceof HTMLElement) {
          cloned.className = originalBtn.className;
          const originalStyle = originalBtn.getAttribute("style");
          if (originalStyle) {
            cloned.setAttribute("style", originalStyle);
          }

          // Copy disabled state
          if (originalBtn.hasAttribute("disabled")) {
            cloned.setAttribute("disabled", "");
          }

          // Connect click handler to trigger original button
          cloned.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Trigger click on original button
            (originalBtn as HTMLElement).click();
          });

          targetContainer.appendChild(cloned);
        }
      });
    };

    // Wait for FormPanel to render, then clone buttons
    const timeout = setTimeout(cloneButtons, 200);

    // Use MutationObserver to watch for changes in FormPanel buttons
    const formPanel = document.querySelector("[data-form-panel-user]");
    const buttonsContainer = formPanel?.querySelector(
      "div.pt-4.border-t.border-white\\/20.flex:last-child",
    );

    let observer: MutationObserver | null = null;
    if (buttonsContainer) {
      observer = new MutationObserver(() => {
        cloneButtons();
      });
      observer.observe(buttonsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "class", "style"],
      });
    }

    return () => {
      clearTimeout(timeout);
      if (observer) {
        observer.disconnect();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div
      ref={containerRef}
      className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-5"
    />
  );
}

interface Props {
  isPurchased?: boolean;
  /** Optional explicit template id — use when rendering outside the router (e.g. in a dialog) */
  templateId?: string;
}

import { FilePen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useAdminConsoleStore } from "@/store/useAdminConsoleStore";
import EditorPanel from "./EditorPanel";
import AiChatPanel from "./AiChatPanel";

export default function SvgFormTranslator({
  isPurchased,
  templateId: templateIdProp,
}: Props) {
  const user = useAuthStore((state) => state.user);

  // Check if user was redirected from AI chat — open AI tab by default
  const defaultTab =
    new URLSearchParams(window.location.search).get("tab") === "ai"
      ? "ai"
      : "editor";

  const [svgText, setSvgText] = useState<string>("");
  const [debouncedFields, setDebouncedFields] = useState<FormField[]>([]);
  const [livePreview, setLivePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const pendingFieldsRef = useRef<FormField[] | null>(null);
  const baseSvgRef = useRef<string>("");
  const baseSvgDocRef = useRef<Document | null>(null);

  // Use selectors to subscribe only to what we need
  const setFields = useToolStore((state) => state.setFields);
  const setSvgRaw = useToolStore((state) => state.setSvgRaw);
  const setName = useToolStore((state) => state.setName);
  const fields = useToolStore((state) => state.fields);

  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const id = templateIdProp ?? paramId;

  // Fetch template data (without SVG for faster loading)
  const { data, isLoading, error } = useQuery<PurchasedTemplate | Template>({
    queryKey: [isPurchased ? "purchased-template" : "template", id],
    queryFn: () =>
      isPurchased
        ? getPurchasedTemplate(id as string)
        : getTemplate(id as string),
    enabled: !!id, // Only run query if id exists
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30s cache
  });

  // No longer fetching SVG separately - it's included as svg_url in the main data

  const [svgContent, setSvgContent] = useState<string>("");
  const [isSvgFetching, setIsSvgFetching] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isAssetsLoading, setIsAssetsLoading] = useState<boolean>(false);
  const lastLoadedBaseUrl = useRef<string | null>(null);
  const baseSvgText = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.svg_url) return;

    const isNewUrl = data.svg_url !== lastLoadedBaseUrl.current;
    let cancelled = false;

    const fetchWithProgress = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);

        xhr.onprogress = (event) => {
          if (event.lengthComputable && !cancelled) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );
            setDownloadProgress(percentComplete);
            console.log(
              `[SvgFormTranslator] Download progress: ${percentComplete}%`,
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`HTTP error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send();
      });
    };

    const loadAndApply = async () => {
      try {
        let text = baseSvgText.current;

        // Re-fetch only if URL changed or we don't have the base text yet
        if (isNewUrl || !text) {
          setIsSvgFetching(true);
          setDownloadProgress(0);

          text = await fetchWithProgress(data.svg_url!);

          if (!cancelled) {
            baseSvgText.current = text;
            lastLoadedBaseUrl.current = data.svg_url!;
          }
        }

        if (text && !cancelled) {
          // Always apply current patches to the base text
          const patchedBase = applySvgPatches(text, data.svg_patches || []);
          setSvgContent(patchedBase);
        }
      } catch (e) {
        if (cancelled) return;
        console.warn(
          "Failed to load SVG via direct URL, trying backend proxy...",
          e,
        );
        try {
          // Fallback to proxy
          const targetId =
            isPurchased && data && "template" in data
              ? (data as PurchasedTemplate).template
              : (id as string);
          setIsSvgFetching(true);
          setDownloadProgress(0);
          const text = await getTemplateSvgForAdmin(targetId);
          if (!cancelled) {
            baseSvgText.current = text;
            lastLoadedBaseUrl.current = data.svg_url!; // Mark this URL as "last loaded"
            const patchedBase = applySvgPatches(text, data.svg_patches || []);
            setSvgContent(patchedBase);
          }
        } catch (proxyErr) {
          if (!cancelled) {
            console.error(
              "Failed to load SVG content from all sources",
              proxyErr,
            );
            toast.error("Cloud storage sync failed.");
          }
        }
      } finally {
        if (!cancelled) {
          setIsSvgFetching(false);
          setIsAssetsLoading(false);
          setDownloadProgress(100);
        }
      }
    };

    loadAndApply();
    return () => {
      cancelled = true;
    };
  }, [data?.svg_url, isLoading, data, id, isPurchased]); // Removed svgContent dependency

  // Initialize fields immediately when template data loads (before SVG)
  useEffect(() => {
    if (isLoading || !data) return;

    // Check for duplicated values in location state
    const locationState = location as any;
    const startValues = locationState.state?.startValues;

    // Initialize fields - use currentValue if available (for purchased templates), otherwise use defaultValue
    const initializedFields =
      data.form_fields?.map((field: FormField) => {
        let currentValue = field.currentValue ?? field.defaultValue ?? "";

        // SPECIAL CASE: Select fields must have a valid option value
        if (field.options && field.options.length > 0 && !currentValue) {
          currentValue = field.options[0].value;
        }

        // Apply startValues (duplicated data) if present
        if (startValues && startValues[field.id] !== undefined) {
          currentValue = startValues[field.id] as string | number | boolean;
        }

        if (field.type === "select") {
          console.log(
            `[Select-Init] Field ${field.id}: incomingCurrentValue='${field.currentValue}', incomingDefaultValue='${field.defaultValue}', resultCurrentValue='${currentValue}'`,
          );
        }

        return {
          ...field,
          currentValue,
          // If it came from startValues, mark it as touched so it's treated as "provided" data
          touched: startValues ? startValues[field.id] !== undefined : false,
        };
      }) || [];

    setName(data.name as string);
    setFields(initializedFields, isPurchased);

    // ADMIN DEBUG: Log form fields for troubleshooting
    if (user?.is_staff || user?.role === "ZK7T-93XY") {
      console.log(
        `[SvgFormTranslator] Initialized ${initializedFields.length} fields for ${isPurchased ? "purchased " : ""}template: ${id}`,
      );
      console.log(`[SvgFormTranslator] Template Name: ${data.name}`);
      console.log(`[SvgFormTranslator] Template ID: ${id}`);

      // Log to the custom UI console
      const { addLog } = useAdminConsoleStore.getState();
      addLog(
        "success",
        `Loaded ${initializedFields.length} form fields for: ${data.name}`,
        {
          templateId: id,
          templateName: data.name,
          fieldCount: initializedFields.length,
        },
      );

      // Log each field type breakdown
      const fieldTypes = initializedFields.reduce(
        (acc, f) => {
          acc[f.type] = (acc[f.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      addLog(
        "info",
        `Field types: ${Object.entries(fieldTypes)
          .map(([k, v]) => `${k}(${v})`)
          .join(", ")}`,
      );

      // Detailed field table
      if (initializedFields.length > 0) {
        const fieldDetails = initializedFields.map((f) => ({
          ID: f.id,
          Type: f.type,
          Name: f.name,
          Value: f.currentValue,
          Default: f.defaultValue,
          DependsOn: f.dependsOn || "-",
          Grayscale: f.requiresGrayscale
            ? `Yes (${f.grayscaleIntensity}%)`
            : "No",
          Editable: f.editable ? "✓" : "-",
          Tracking: f.trackingRole || "-",
        }));

        console.table(fieldDetails);

        // Log to admin console
        addLog("table", "Form Fields Detail", fieldDetails);
      } else {
        console.warn(
          "[SvgFormTranslator] NO FIELDS INITIALIZED! Check if template has IDs.",
        );
        addLog("error", "NO FIELDS INITIALIZED! SVG may have missing IDs.", {
          templateId: id,
        });
      }
    }

    // Store fields in ref to apply changes once SVG loads
    pendingFieldsRef.current = initializedFields;
  }, [data, isLoading, setName, setFields, isPurchased, location.state]);

  const hasSyncedRef = useRef<string | null>(null);

  // EFFECT 3: Sync defaults from SVG text (runs once when SVG content is ready)
  useEffect(() => {
    // skip sync if we have startValues (duplicating a doc) to prevent overwriting
    const locationState = location as any;
    const startValues = locationState.state?.startValues;
    if (isSvgFetching || !svgContent || !data || isPurchased || startValues)
      return;

    // Only run this sync once per SVG URL
    if (hasSyncedRef.current === data.svg_url) return;
    hasSyncedRef.current = data.svg_url || null;

    const fieldsToUse =
      fields.length > 0 ? fields : pendingFieldsRef.current || [];
    const parsedElements = parseSvgElements(svgContent);
    const validTypes = ["text", "textarea", "email", "tel", "url", "number"];

    let hasUpdates = false;
    const populatedFields = fieldsToUse.map((field) => {
      if (validTypes.includes(field.type) && !field.touched) {
        const targetId = (field.svgElementId || field.id).trim();
        const element = parsedElements.find((el) => {
          const elId = el.id || "";
          const origId = el.originalId || "";
          const intId = el.internalId || "";
          return elId === targetId || origId === targetId || intId === targetId;
        });

        if (element && element.innerText && element.innerText.trim() !== "") {
          if (field.currentValue !== element.innerText) {
            hasUpdates = true;
            return { ...field, currentValue: element.innerText };
          }
        }
      }
      return field;
    });

    if (hasUpdates) {
      setTimeout(() => {
        useToolStore.getState().setFields(populatedFields, isPurchased);
      }, 0);
    }
  }, [svgContent, isSvgFetching, data, isPurchased]);

  // DEBOUNCE EFFECT: Updates debouncedFields when users stop typing
  // Adaptive debounce: 250ms on high-end, 500ms on low-end devices
  useEffect(() => {
    const debounceMs = getAdaptiveDebounce(250, 500);
    const handler = setTimeout(() => {
      setDebouncedFields(fields);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [fields]);

  // EFFECT 4: Live Preview Update - Re-runs whenever debouncedFields or SVG content changes
  useEffect(() => {
    if (isSvgFetching || !svgContent || !data) return;

    const finalizeSvg = async () => {
      // 1. Get or create base SVG Document (with injected fonts)
      let baseDoc = baseSvgDocRef.current;

      if (!baseDoc || baseSvgRef.current !== svgContent) {
        let svgWithFonts = svgContent;
        if (data.fonts && data.fonts.length > 0) {
          svgWithFonts = await injectFontsIntoSVG(
            svgContent,
            data.fonts,
            BASE_URL,
            true,
          );
        }

        const parser = new DOMParser();
        baseDoc = parser.parseFromString(svgWithFonts, "image/svg+xml");
        baseSvgDocRef.current = baseDoc;
        baseSvgRef.current = svgContent;
        console.log("[SvgFormTranslator] Base SVG DOM cached (with fonts).");
      }

      // 2. Clone the base doc so we don't mutate the cached one
      const workDoc = baseDoc.cloneNode(true) as Document;

      // 3. Process SVG with current field values (efficiently using DOM)
      const fieldsWithAutoGenerated = generateAutoFields(
        debouncedFields,
        isPurchased,
      );
      updateSvgFromFormData(workDoc, fieldsWithAutoGenerated);

      // 4. Inject images (including signatures/blobs) - optimized to use cloned DOM
      const injectedResult = await injectImagesIntoSVG(workDoc, BASE_URL);
      const finalSvgText =
        injectedResult instanceof Document
          ? new XMLSerializer().serializeToString(injectedResult)
          : injectedResult;

      setSvgText(finalSvgText);
      setSvgRaw(finalSvgText);

      // 5. Sanitize gradients for preview display
      const ns = svgNamespace(finalSvgText);
      const sanitizedBase = sanitizeSvgGradients(finalSvgText, ns);

      const shouldWatermark =
        !isPurchased ||
        (isPurchased && (data as { test?: boolean }).test === true);
      const previewSvg = shouldWatermark
        ? addWatermarkToSvg(sanitizedBase)
        : sanitizedBase;

      setLivePreview(previewSvg);
      useToolStore.getState().setSvgPreview(previewSvg);
      pendingFieldsRef.current = null;
    };

    finalizeSvg();
  }, [
    svgContent,
    isSvgFetching,
    data,
    debouncedFields,
    isPurchased,
    setSvgRaw,
  ]);

  const purchasedData = data as PurchasedTemplate;

  // Separate effect for status fields to avoid conflicts
  useEffect(() => {
    if (isLoading || !data) return;

    if (isPurchased) {
      // Status and error message are now handled by the SVG template fields
    }
  }, [
    data,
    isLoading,
    isPurchased,
    purchasedData?.status,
    purchasedData?.error_message,
  ]);

  // Memoize font injection to avoid recalculating - fonts don't change, so we only inject once
  const fonts = useMemo(() => data?.fonts || [], [data?.fonts]);

  // Store base SVG (with fonts already injected) - fonts don't change during editing
  useEffect(() => {
    const updateBaseSvg = async () => {
      if (svgText) {
        if (fonts.length > 0) {
          baseSvgRef.current = await injectFontsIntoSVG(
            svgText,
            fonts,
            BASE_URL,
            true,
          );
        } else {
          baseSvgRef.current = svgText;
        }
      }
    };
    updateBaseSvg();
  }, [svgText, fonts]);

  // EFFECT 4 already handles the preview update with DOM caching and debouncing.
  // This helps maintain a single source of truth for the SVG state and improves performance.

  // Hide FormPanel buttons when component mounts/updates
  // MUST be called before any early returns to maintain consistent hook count
  useEffect(() => {
    // Only hide buttons if not loading and no error (FormPanel is rendered)
    if (isLoading || error) return;

    const hideFormPanelButtons = () => {
      const formPanel = document.querySelector("[data-form-panel-user]");
      if (formPanel) {
        // Find the buttons container (last div with pt-4 border-t)
        const buttonsContainer = formPanel.querySelector(
          "div.pt-4.border-t.border-white\\/20.flex:last-child",
        );
        if (buttonsContainer) {
          (buttonsContainer as HTMLElement).style.display = "none";
        }
      }
    };

    // Hide buttons after a short delay to ensure FormPanel has rendered
    const timeout = setTimeout(hideFormPanelButtons, 100);
    return () => clearTimeout(timeout);
  }, [activeTab, data, isLoading, error]);

  // Handle loading state - show skeleton while template data loads
  // MUST be after all hooks to maintain consistent hook count
  if (isLoading) {
    return <SvgFormTranslatorSkeleton />;
  }

  // Handle error state
  // MUST be after all hooks to maintain consistent hook count
  if (error) {
    return (
      <div className="flex flex-col gap-5 items-center justify-center h-100">
        <h2 className="text-lg text-red-500">
          Error loading {isPurchased ? "document" : "tool"}
        </h2>
        <p className="text-sm text-gray-600">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Edit Link */}
      {user?.is_staff && (
        <div className="flex justify-end mb-4">
          <Link
            to={`/admin/templates/${isPurchased && data ? (data as PurchasedTemplate).template : id}`}
            className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 px-4 py-2 rounded-xl transition-colors text-sm font-medium backdrop-blur-sm"
          >
            <FilePen className="w-4 h-4" />
            Edit Template (Admin)
          </Link>
        </div>
      )}

      <Tabs
        defaultValue="editor"
        className="w-full px-0"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          // When switching to preview, immediately update with fresh values
          if (value === "preview" && baseSvgDocRef.current) {
            // Changed baseSvgRef.current to baseSvgDocRef.current
            const freshFields = useToolStore.getState().fields;
            if (freshFields.length > 0) {
              const fieldsWithAutoGenerated = generateAutoFields(
                freshFields,
                isPurchased,
              );
              // Clone the baseDocRef.current before modifying it
              const workDoc = baseSvgDocRef.current.cloneNode(true) as Document;
              const updatedSvg = updateSvgFromFormData(
                workDoc,
                fieldsWithAutoGenerated,
              );
              const svgString =
                updatedSvg instanceof Document
                  ? new XMLSerializer().serializeToString(updatedSvg)
                  : updatedSvg;
              const shouldWatermark =
                !isPurchased ||
                (isPurchased &&
                  (data as { test?: boolean } | undefined)?.test === true);
              setLivePreview(
                shouldWatermark ? addWatermarkToSvg(svgString) : svgString,
              );
            }
          }
        }}
      >
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Keep editor tab always mounted to prevent re-rendering lag when switching back */}
        <div style={{ display: activeTab === "editor" ? "block" : "none" }}>
          <TabsContent value="editor" forceMount className="space-y-4">
            <EditorPanel
              isPurchased={Boolean(isPurchased)}
              test={purchasedData?.test}
              tutorial={data && "tutorial" in data ? data.tutorial : undefined}
              templateId={
                isPurchased ? purchasedData?.template : (id as string)
              }
              toolPrice={
                (data as unknown as Record<string, number>)?.tool_price
              }
              keywords={data?.keywords || []}
            />
          </TabsContent>
        </div>

        <div style={{ display: activeTab === "ai" ? "block" : "none" }}>
          <TabsContent value="ai" forceMount className="space-y-4">
            <div className="h-[600px] flex flex-col bg-white/5 border border-white/10 rounded-xl overflow-hidden mt-4">
              <AiChatPanel
                templateId={isPurchased ? undefined : id}
                purchasedTemplateId={isPurchased ? id : undefined}
              />
            </div>
          </TabsContent>
        </div>

        <div style={{ display: activeTab === "preview" ? "block" : "none" }}>
          <TabsContent value="preview" forceMount className="space-y-4">
            {!svgText || isSvgFetching || isAssetsLoading ? (
              <PreviewSkeleton
                progress={downloadProgress || (isAssetsLoading ? 95 : 0)}
              />
            ) : (
              <div
                className={`w-full overflow-auto p-2 sm:p-5 bg-white/10 border border-white/20 rounded-xl transition-all duration-700 ease-in-out ${
                  isSvgFetching || isAssetsLoading
                    ? "opacity-0 scale-[0.98]"
                    : "opacity-100 scale-100"
                }`}
              >
                <div className="min-w-full inline-block align-middle overflow-x-auto">
                  <div className="min-h-[400px] sm:min-h-[600px] flex items-center justify-center bg-white/5 rounded-lg overflow-hidden">
                    <div
                      data-svg-preview
                      className="bg-white shadow-2xl mx-auto w-auto min-w-[600px] sm:min-w-0 sm:w-full [&_svg]:w-full [&_svg]:h-auto"
                      dangerouslySetInnerHTML={{
                        __html: livePreview || svgText,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <ActionButtonsRenderer />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
