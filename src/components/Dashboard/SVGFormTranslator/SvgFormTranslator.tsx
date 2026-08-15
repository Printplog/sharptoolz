// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState, useRef, useMemo } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { injectImagesIntoSVG } from "@/lib/utils/imageInjector";
import { BASE_URL } from "@/api/apiClient";
import { addWatermarkToSvg } from "@/lib/utils/svgWatermark";
import { sanitizeSvgGradients, svgNamespace } from "@/lib/utils/sanitizeSvgGradients";
import { generateAutoFields } from "@/lib/utils/fieldGenerator";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "react-router-dom";
import {
  getPurchasedTemplate,
  getTemplate,
  getTemplateSvgForAdmin
} from "@/api/apiEndpoints";
import type { EmbedSessionData, FormField, PurchasedTemplate, Template } from "@/types";
import SvgFormTranslatorSkeleton from "./SvgFormTranslatorSkeleton";
import PreviewSkeleton from "./PreviewSkeleton";
import parseSvgElements from "@/lib/utils/parseSvgElements";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import { toast } from "sonner";
import { getAdaptiveDebounce } from "@/lib/utils/deviceDetection";
import { sanitizeSvgForEmbed } from "@/lib/utils/sanitizeSvgForEmbed";
import ProtectedCanvasPreview from "./ProtectedCanvasPreview";

// Component to render action buttons by cloning and connecting to FormPanel buttons
function ActionButtonsRenderer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cloneButtons = () => {
      const formPanel = document.querySelector('[data-form-panel-user]');
      const targetContainer = containerRef.current;

      if (!formPanel || !targetContainer) return;

      // Find the buttons container in FormPanel
      const buttonsContainer = formPanel.querySelector('div.pt-4.border-t.border-white\\/20.flex:last-child') as HTMLElement;
      if (!buttonsContainer) return;

      // Get all buttons from FormPanel
      const originalButtons = buttonsContainer.querySelectorAll('button, a');

      // Clear existing content
      targetContainer.innerHTML = '';

      // Clone each button and connect click handlers
      originalButtons.forEach((originalBtn) => {
        const cloned = originalBtn.cloneNode(true) as HTMLElement;

        // Preserve all attributes and styles
        if (originalBtn instanceof HTMLElement) {
          cloned.className = originalBtn.className;
          const originalStyle = originalBtn.getAttribute('style');
          if (originalStyle) {
            cloned.setAttribute('style', originalStyle);
          }

          // Copy disabled state
          if (originalBtn.hasAttribute('disabled')) {
            cloned.setAttribute('disabled', '');
          }

          // Connect click handler to trigger original button
          cloned.addEventListener('click', (e) => {
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
    const formPanel = document.querySelector('[data-form-panel-user]');
    const buttonsContainer = formPanel?.querySelector('div.pt-4.border-t.border-white\\/20.flex:last-child');

    let observer: MutationObserver | null = null;
    if (buttonsContainer) {
      observer = new MutationObserver(() => {
        cloneButtons();
      });
      observer.observe(buttonsContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'class', 'style']
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
  /**
   * A hosted session still uses the real translator workspace. The session
   * only replaces the normal account-backed data source and purchase action.
   */
  hosted?: {
    session: EmbedSessionData;
    embedToken: string;
    parentOrigin: string;
    onSubmit: () => void | Promise<void>;
    isSubmitting: boolean;
    error?: string;
  };
}

type DuplicateLocationState = {
  startValues?: Record<string, string | number | boolean>;
};

import { FilePen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function SvgFormTranslator({ isPurchased, templateId: templateIdProp, hosted }: Props) {
  const user = useAuthStore((state) => state.user);
  const hostedSession = hosted?.session;
  const isHosted = Boolean(hostedSession);
  const isEditingDocument = Boolean(isPurchased || hostedSession?.operation === "edit");
  const protectedPreview = hostedSession?.template.protected_preview;
  const isProtectedHosted = Boolean(
    hostedSession?.preview_mode === "protected" && protectedPreview,
  );

  const [svgText, setSvgText] = useState<string>("");
  const [debouncedFields, setDebouncedFields] = useState<FormField[]>([]);
  const [livePreview, setLivePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("editor");
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
  const startValues = (location.state as DuplicateLocationState | null)?.startValues;
  const id = hostedSession?.template.id ?? templateIdProp ?? paramId;

  const hostedTemplate = useMemo<Template | undefined>(() => {
    if (!hostedSession) return undefined;
    const { template } = hostedSession;
    return {
      id: template.id,
      name: template.name,
      version: template.version,
      form_fields: template.form_fields,
      svg_url: template.svg_url || undefined,
      svg_patches: template.svg_patches || [],
      fonts: template.fonts || [],
      keywords: [],
      type: "tool",
      hot: false,
      created_at: "",
      updated_at: "",
      is_active: true,
      banner: "",
      protected_preview: template.protected_preview,
    };
  }, [hostedSession]);

  // Fetch template data (without SVG for faster loading)
  const { data: queriedData, isLoading: isQueryLoading, error: queryError } = useQuery<PurchasedTemplate | Template>({
    queryKey: [isPurchased ? "purchased-template" : "template", id],
    queryFn: () =>
      isPurchased
        ? getPurchasedTemplate(id as string)
        : getTemplate(id as string),
    enabled: !isHosted && !!id, // Hosted sessions are the trusted data source inside the iframe.
    refetchOnWindowFocus: true,
    staleTime: 30 * 1000, // 30s cache
  });

  const data = hostedTemplate ?? queriedData;
  const isLoading = isHosted ? false : isQueryLoading;
  const error = isHosted ? null : queryError;


  // No longer fetching SVG separately - it's included as svg_url in the main data

  const [svgContent, setSvgContent] = useState<string>("");
  const [isSvgFetching, setIsSvgFetching] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isAssetsLoading, setIsAssetsLoading] = useState<boolean>(false);
  const lastLoadedBaseUrl = useRef<string | null>(null);
  const baseSvgText = useRef<string | null>(null);

  useEffect(() => {
    if (isProtectedHosted || !data?.svg_url) return;

    const isNewUrl = data.svg_url !== lastLoadedBaseUrl.current;
    let cancelled = false;

    const fetchWithProgress = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        
        xhr.onprogress = (event) => {
          if (event.lengthComputable && !cancelled) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setDownloadProgress(percentComplete);
            console.log(`[SvgFormTranslator] Download progress: ${percentComplete}%`);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`HTTP error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
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
          const safeBase = isHosted ? sanitizeSvgForEmbed(patchedBase) : patchedBase;
          setSvgContent(safeBase);
        }
      } catch (e) {
        if (cancelled) return;
        console.warn("Failed to load SVG via direct URL, trying backend proxy...", e);
        try {
          if (isHosted) throw e;
          // Fallback to proxy
          const targetId = isPurchased && data && 'template' in data ? (data as PurchasedTemplate).template : id as string;
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
            console.error("Failed to load SVG content from all sources", proxyErr);
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
    return () => { cancelled = true; };
  }, [data?.svg_url, isLoading, data, id, isPurchased, isHosted, isProtectedHosted]); // Removed svgContent dependency

  // Initialize fields immediately when template data loads (before SVG)
  useEffect(() => {
    if (isLoading || !data) return;

    // Check for duplicated values in location state
    const hostedPrefill = hostedSession?.prefill;

    // Initialize fields - use currentValue if available (for purchased templates), otherwise use defaultValue
    const initializedFields = data.form_fields?.map((field: FormField) => {
      const hasHostedPrefill = Boolean(
        hostedPrefill && Object.prototype.hasOwnProperty.call(hostedPrefill, field.id)
      );
      let currentValue = hasHostedPrefill
        ? hostedPrefill?.[field.id] ?? ""
        : field.currentValue ?? field.defaultValue ?? "";

      // SPECIAL CASE: Select fields must have a valid option value
      if (field.options && field.options.length > 0 && !currentValue) {
        currentValue = field.options[0].value;
      }

      // Apply startValues (duplicated data) if present
      if (startValues && startValues[field.id] !== undefined) {
        currentValue = startValues[field.id] as string | number | boolean;
      }

      if (field.type === "select") {
        console.log(`[Select-Init] Field ${field.id}: incomingCurrentValue='${field.currentValue}', incomingDefaultValue='${field.defaultValue}', resultCurrentValue='${currentValue}'`);
      }

      return {
        ...field,
        currentValue,
        // If it came from startValues, mark it as touched so it's treated as "provided" data
        touched: hasHostedPrefill || (startValues ? (startValues[field.id] !== undefined) : false)
      };
    }) || [];

    setName(
      isHosted
        ? hostedSession?.document_name || `My ${data.name}`
        : data.name as string,
    );
    const fieldsWithAuto = generateAutoFields(initializedFields, isEditingDocument);
    setFields(fieldsWithAuto, isEditingDocument);

    // ADMIN DEBUG: Log form fields for troubleshooting
    if (user?.is_staff || user?.role === 'ZK7T-93XY') {
      console.log(`[SvgFormTranslator] Initialized ${initializedFields.length} fields for ${isPurchased ? 'purchased ' : ''}template: ${id}`);
      console.log(`[SvgFormTranslator] Template Name: ${data.name}`);
      console.log(`[SvgFormTranslator] Template ID: ${id}`);

      // Log each field type breakdown

      // Detailed field table
      if (initializedFields.length > 0) {
        const fieldDetails = initializedFields.map(f => ({
          ID: f.id,
          Type: f.type,
          Name: f.name,
          Value: f.currentValue,
          Default: f.defaultValue,
          DependsOn: f.dependsOn || '-',
          Grayscale: f.requiresGrayscale ? `Yes (${f.grayscaleIntensity}%)` : 'No',
          Editable: f.editable ? '✓' : '-',
          Tracking: f.trackingRole || '-',
        }));

        console.table(fieldDetails);
      } else {
        console.warn('[SvgFormTranslator] NO FIELDS INITIALIZED! Check if template has IDs.');
      }
    }

    // Store fields in ref to apply changes once SVG loads
    pendingFieldsRef.current = initializedFields;

  }, [data, isLoading, setName, setFields, isPurchased, isEditingDocument, startValues, hostedSession, isHosted, id, user?.is_staff, user?.role]);

  const hasSyncedRef = useRef<string | null>(null);

  // EFFECT 3: Sync defaults from SVG text (runs once when SVG content is ready)
  useEffect(() => {
    if (isProtectedHosted) return;
    // skip sync if we have startValues (duplicating a doc) to prevent overwriting
    if (isSvgFetching || !svgContent || !data || isEditingDocument || startValues) return;

    // Only run this sync once per SVG URL
    if (hasSyncedRef.current === data.svg_url) return;
    hasSyncedRef.current = data.svg_url || null;

    const fieldsToUse = fields.length > 0 ? fields : (pendingFieldsRef.current || []);
    const parsedElements = parseSvgElements(svgContent);
    const validTypes = ['text', 'textarea', 'email', 'tel', 'url', 'number'];

    let hasUpdates = false;
    const populatedFields = fieldsToUse.map(field => {
      if (validTypes.includes(field.type) && !field.touched) {
        const targetId = (field.svgElementId || field.id).trim();
        const element = parsedElements.find(el => {
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
        useToolStore.getState().setFields(populatedFields, isEditingDocument);
      }, 0);
    }
  }, [svgContent, isSvgFetching, data, isEditingDocument, isProtectedHosted, startValues, fields]);

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
    if (isProtectedHosted) return;
    if (isSvgFetching || !svgContent || !data) return;

    const finalizeSvg = async () => {
      // 1. Get or create base SVG Document (with injected fonts)
      let baseDoc = baseSvgDocRef.current;
      
      if (!baseDoc || baseSvgRef.current !== svgContent) {
        let svgWithFonts = svgContent;
        if (data.fonts && data.fonts.length > 0) {
          svgWithFonts = await injectFontsIntoSVG(svgContent, data.fonts, BASE_URL, true);
        }
        
        const parser = new DOMParser();
        baseDoc = parser.parseFromString(svgWithFonts, "image/svg+xml");
        baseSvgDocRef.current = baseDoc;
        baseSvgRef.current = svgContent;
        console.log('[SvgFormTranslator] Base SVG DOM cached (with fonts).');
      }

      // 2. Clone the base doc so we don't mutate the cached one
      const workDoc = baseDoc.cloneNode(true) as Document;

      // 3. Process SVG with current field values (efficiently using DOM)
      const fieldsWithAutoGenerated = generateAutoFields(debouncedFields, isEditingDocument);
      updateSvgFromFormData(workDoc, fieldsWithAutoGenerated);

      // 4. Inject images (including signatures/blobs) - optimized to use cloned DOM
      const injectedResult = await injectImagesIntoSVG(workDoc, BASE_URL);
      const finalSvgText = injectedResult instanceof Document ? new XMLSerializer().serializeToString(injectedResult) : injectedResult;

      setSvgText(finalSvgText);
      setSvgRaw(finalSvgText); 

      // 5. Sanitize gradients for preview display
      const ns = svgNamespace(finalSvgText);
      const sanitizedBase = sanitizeSvgGradients(finalSvgText, ns);

      const shouldWatermark = !isPurchased || (isPurchased && (data as { test?: boolean }).test === true);
      const previewSvg = shouldWatermark ? addWatermarkToSvg(sanitizedBase) : sanitizedBase;

      setLivePreview(previewSvg);
      pendingFieldsRef.current = null;
    };

    finalizeSvg();
  }, [svgContent, isSvgFetching, data, debouncedFields, isPurchased, isEditingDocument, setSvgRaw, isProtectedHosted]);

  const purchasedData = data as PurchasedTemplate;

  // Separate effect for status fields to avoid conflicts
  useEffect(() => {
    if (isLoading || !data) return;

    if (isPurchased) {
      // Status and error message are now handled by the SVG template fields
    }

  }, [data, isLoading, isPurchased, purchasedData?.status, purchasedData?.error_message]);

  // Memoize font injection to avoid recalculating - fonts don't change, so we only inject once
  const fonts = useMemo(() => data?.fonts || [], [data?.fonts]);

  // Store base SVG (with fonts already injected) - fonts don't change during editing
  useEffect(() => {
    const updateBaseSvg = async () => {
      if (svgText) {
        if (fonts.length > 0) {
          baseSvgRef.current = await injectFontsIntoSVG(svgText, fonts, BASE_URL, true);
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
      const formPanel = document.querySelector('[data-form-panel-user]');
      if (formPanel) {
        // Find the buttons container (last div with pt-4 border-t)
        const buttonsContainer = formPanel.querySelector('div.pt-4.border-t.border-white\\/20.flex:last-child');
        if (buttonsContainer) {
          (buttonsContainer as HTMLElement).style.display = 'none';
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
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Admin Edit Link */}
      {!isHosted && user?.is_staff && (
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
          if (value === "preview") {
            if (isProtectedHosted) return;
            console.log("[PREVIEW-DEBUG] 👁️ Switching to Preview Tab - forcing fresh generation");
            if (baseSvgDocRef.current) {
            const freshFields = useToolStore.getState().fields;
            if (freshFields.length > 0) {
              const fieldsWithAutoGenerated = generateAutoFields(freshFields, isEditingDocument);
              // Clone the baseDocRef.current before modifying it
              const workDoc = baseSvgDocRef.current.cloneNode(true) as Document;
              const updatedSvg = updateSvgFromFormData(workDoc, fieldsWithAutoGenerated);
              const svgString = updatedSvg instanceof Document ? new XMLSerializer().serializeToString(updatedSvg) : updatedSvg;
              const shouldWatermark = !isPurchased || (isPurchased && (data as { test?: boolean } | undefined)?.test === true);
              setLivePreview(shouldWatermark ? addWatermarkToSvg(svgString) : svgString);
            }
            }
          }
        }}
      >
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        {/* Keep editor tab always mounted to prevent re-rendering lag when switching back */}
        <div style={{ display: activeTab === "editor" ? "block" : "none" }}>
          <TabsContent value="editor" forceMount className="space-y-4">
            <div data-form-panel-user>
              <FormPanel
                test={hostedSession ? hostedSession.mode === "test" : purchasedData?.test}
                tutorial={data && 'tutorial' in data ? data.tutorial : undefined}
                templateId={isPurchased ? purchasedData?.template : undefined}
                isPurchased={isEditingDocument}
                toolPrice={(data as unknown as Record<string, number>)?.tool_price}
                keywords={data?.keywords || []}
                hosted={hosted && hostedSession ? {
                  onSubmit: hosted.onSubmit,
                  isSubmitting: hosted.isSubmitting,
                  error: hosted.error,
                  buttonText: hostedSession.operation === "edit"
                    ? "Update document"
                    : hostedSession.theme.buttonText,
                } : undefined}
              />
            </div>
            {/* Action Buttons - cloned from FormPanel to show in both tabs */}
            <ActionButtonsRenderer />
          </TabsContent>
        </div>
        <div style={{ display: activeTab === "preview" ? "block" : "none" }}>
          <TabsContent value="preview" forceMount className="space-y-4">
            {/* Only show skeleton if we don't have SVG text or assets are loading */}
            {isProtectedHosted && protectedPreview && hosted ? (
              <div className="w-full overflow-auto rounded-xl border border-white/20 bg-white/10 p-2 sm:p-5">
                <ProtectedCanvasPreview
                  preview={protectedPreview}
                  embedToken={hosted.embedToken}
                  parentOrigin={hosted.parentOrigin}
                  isTest={hosted.session.mode === "test"}
                  templateName={hosted.session.template.name}
                />
              </div>
            ) : (!svgText || isSvgFetching || isAssetsLoading) ? (
              <PreviewSkeleton progress={downloadProgress || (isAssetsLoading ? 95 : 0)} />
            ) : (
              <div
                className={`w-full overflow-auto p-2 sm:p-5 bg-white/10 border border-white/20 rounded-xl transition-all duration-700 ease-in-out ${(isSvgFetching || isAssetsLoading) ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                  }`}
              >
                {/* Mobile: horizontal scroll container with min-height */}
                <div className="min-w-full inline-block align-middle overflow-x-auto">
                    <div 
                        className="min-h-[400px] sm:min-h-[600px] flex items-center justify-center bg-white/5 rounded-lg overflow-hidden"
                    >
                        <div
                            data-svg-preview
                            className="bg-white shadow-2xl mx-auto w-auto min-w-[600px] sm:min-w-0 sm:w-full [&_svg]:w-full [&_svg]:h-auto"
                            dangerouslySetInnerHTML={{ __html: livePreview || svgText }}
                        />
                    </div>
                </div>
              </div>
            )}
            {/* Action Buttons - always rendered in preview tab to maintain consistent hook count */}
            <ActionButtonsRenderer />
          </TabsContent>
        </div>

      </Tabs>
    </div>
  );
}
