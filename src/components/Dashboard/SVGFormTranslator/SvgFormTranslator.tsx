// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState, useRef, useMemo } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { generateAutoFields } from "@/lib/utils/fieldGenerator";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  getPurchasedTemplate,
  getTemplate,
  getTemplateSvgForAdmin
} from "@/api/apiEndpoints";
import type { FormField, PurchasedTemplate, Template } from "@/types";
import SvgFormTranslatorSkeleton from "./SvgFormTranslatorSkeleton";
import PreviewSkeleton from "./PreviewSkeleton";
import parseSvgElements from "@/lib/utils/parseSvgElements";
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import { toast } from "sonner";

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
}

import { FilePen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function SvgFormTranslator({ isPurchased }: Props) {
  const user = useAuthStore((state) => state.user);
  // ... rest of imports/setup logic ... (wait, I should only replace the top imports and start of function, but I need to insert the button in JSX)

  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("editor");
  const pendingFieldsRef = useRef<FormField[] | null>(null);
  const baseSvgRef = useRef<string>("");

  // Use selectors to subscribe only to what we need
  const setFields = useToolStore((state) => state.setFields);
  const setSvgRaw = useToolStore((state) => state.setSvgRaw);
  const setName = useToolStore((state) => state.setName);
  const fields = useToolStore((state) => state.fields);

  const { id } = useParams<{ id: string }>();

  // Fetch template data (without SVG for faster loading)
  const { data, isLoading, error } = useQuery<PurchasedTemplate | Template>({
    queryKey: [isPurchased ? "purchased-template" : "template", id],
    queryFn: () =>
      isPurchased
        ? getPurchasedTemplate(id as string)
        : getTemplate(id as string),
    enabled: !!id, // Only run query if id exists
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - template data doesn't change often
  });


  // No longer fetching SVG separately - it's included as svg_url in the main data

  const [svgContent, setSvgContent] = useState<string>("");
  const [isSvgFetching, setIsSvgFetching] = useState<boolean>(false);
  const [isAssetsLoading, setIsAssetsLoading] = useState<boolean>(false);

  useEffect(() => {
    // FIGMA-STYLE: Only fetch if we have a URL and haven't loaded the content yet.
    if (data?.svg_url && !svgContent) {
      setIsSvgFetching(true);

      const svgUrl = data.svg_url;
      const templateData = data;
      const templateId = id;

      const loadSvg = async () => {
        try {
          // Try direct URL first
          console.log('[SvgFormTranslator] Fetching SVG via direct URL...');
          const r = await fetch(svgUrl);
          if (!r.ok) throw new Error("Failed to fetch SVG file");
          const text = await r.text();

          // 1. Merge original file with database patches
          const patchedBase = applySvgPatches(text, templateData.svg_patches || []);
          setSvgContent(patchedBase);
          console.log('[SvgFormTranslator] Base SVG loaded via direct URL and patched.');
        } catch (e) {
          console.warn("Failed to load SVG via direct URL, trying backend proxy...", e);
          try {
            // Fallback to proxy
            const targetId = isPurchased && templateData && 'template' in templateData ? (templateData as PurchasedTemplate).template : templateId as string;
            const text = await getTemplateSvgForAdmin(targetId);
            const patchedBase = applySvgPatches(text, templateData.svg_patches || []);
            setSvgContent(patchedBase);
            console.log('[SvgFormTranslator] Base SVG loaded via proxy and patched.');
          } catch (proxyErr) {
            console.error("Failed to load SVG content from all sources", proxyErr);
            toast.error("Cloud storage sync failed.");
          }
        } finally {
          setIsSvgFetching(false);
          setIsAssetsLoading(false);
        }
      };

      loadSvg();
    }
  }, [data?.svg_url, isLoading, data, id, isPurchased, svgContent]);

  // Initialize fields immediately when template data loads (before SVG)
  useEffect(() => {
    if (isLoading || !data) return;

    // Initialize fields - use currentValue if available (for purchased templates), otherwise use defaultValue
    const initializedFields = data.form_fields?.map((field: FormField) => ({
      ...field,
      currentValue: field.currentValue ?? field.defaultValue ?? "",
    })) || [];

    setName(data.name as string);
    setFields(initializedFields, isPurchased);

    // Store fields in ref to apply changes once SVG loads
    pendingFieldsRef.current = initializedFields;

  }, [data, isLoading, setName, setFields, isPurchased]);

  // Process SVG once it loads - DO NOT depend on fields to avoid re-processing on every input
  useEffect(() => {
    if (isSvgFetching || !svgContent || !data) return;

    // Use pending fields if available (user may have made changes before SVG loaded)
    const fieldsToUse = fields.length > 0 ? fields : (pendingFieldsRef.current || []);

    // Generate AUTO fields before processing SVG (skip for purchased docs)
    const fieldsWithAutoGenerated = generateAutoFields(fieldsToUse, isPurchased);

    // Parse SVG to extract text content for fields that have no value
    // This ensures "Default Text" in the SVG appears in the Input fields
    // Parse SVG to extract text content for fields relative to the SVG content
    // This handles both "empty" fields AND fields that should sync with the SVG default text
    const parsedElements = parseSvgElements(svgContent);
    const validTypes = ['text', 'textarea', 'email', 'tel', 'url', 'number', 'select'];

    let hasUpdates = false;
    const populatedFields = fieldsWithAutoGenerated.map(field => {
      // Logic: If the field is NOT touched by the user, we should trust the SVG content 
      // as the 'current' source of truth, because the SVG might have been patched/updated.
      // CRITICAL FIX: Skip this sync for purchased documents to prevent reversion to base template text.
      if (!isPurchased && validTypes.includes(field.type) && !field.touched) {

        // Find matching element by ID (or svgElementId if separate)
        const targetId = (field.svgElementId || field.id).trim();

        const element = parsedElements.find(el => {
          const elId = el.id || "";
          const origId = el.originalId || "";
          const intId = el.internalId || "";
          const targetWithType = targetId + ".";

          // Exact match or match with extension
          return elId === targetId ||
            origId === targetId ||
            intId === targetId ||
            elId.startsWith(targetWithType) ||
            origId.startsWith(targetWithType);
        });

        // If we found the element in the SVG and it has text, use it!
        if (element && element.innerText && element.innerText.trim() !== "") {

          // Only update if it's different to prevent infinite loops (though useEffect guards help)
          if (field.currentValue !== element.innerText) {
            console.log(`[SvgFormTranslator] Syncing field ${field.id} from SVG content: "${element.innerText}"`);
            hasUpdates = true;
            return { ...field, currentValue: element.innerText };
          }
        }
      }
      return field;
    });

    // Update store if we found defaults so inputs reflect the SVG text
    if (hasUpdates) {
      // Use a timeout to ensure this runs after current render cycle
      setTimeout(() => {
        useToolStore.getState().setFields(populatedFields, isPurchased);
      }, 0);
    }

    // Process SVG with current field values (including AUTO generated and Extracted defaults)
    let newSvgText = updateSvgFromFormData(svgContent, populatedFields);

    // Inject fonts if available
    const finalizeSvg = async () => {
      if (data.fonts && data.fonts.length > 0) {
        newSvgText = await injectFontsIntoSVG(newSvgText, data.fonts);
      }

      // Update SVG state
      setSvgText(newSvgText);
      setSvgRaw(newSvgText);

      // Set initial preview immediately (no debounce on first load)
      setLivePreview(newSvgText);

      // Clear pending fields ref
      pendingFieldsRef.current = null;
    };

    finalizeSvg();

    // Only run when SVG data loads, NOT when fields change
  }, [svgContent, isSvgFetching, data, setSvgRaw, isPurchased, fields]);

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
          baseSvgRef.current = await injectFontsIntoSVG(svgText, fonts);
        } else {
          baseSvgRef.current = svgText;
        }
      }
    };
    updateBaseSvg();
  }, [svgText, fonts]);


  // SIMPLIFIED: Update preview whenever fields change and we're on preview tab
  // No debouncing, no change tracking - just always use fresh values
  useEffect(() => {
    if (activeTab !== "preview") return;
    if (!baseSvgRef.current || !fields || fields.length === 0) return;

    // Get fresh fields from store to ensure we have latest values
    const freshFields = useToolStore.getState().fields;

    // Generate AUTO fields before updating preview (skip for purchased docs)
    const fieldsWithAutoGenerated = generateAutoFields(freshFields, isPurchased);

    // Always do full update with all current field values
    const updatedSvg = updateSvgFromFormData(baseSvgRef.current, fieldsWithAutoGenerated);
    setLivePreview(updatedSvg);
  }, [fields, activeTab, isPurchased]);

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
          if (value === "preview" && baseSvgRef.current) {
            const freshFields = useToolStore.getState().fields;
            if (freshFields.length > 0) {
              const fieldsWithAutoGenerated = generateAutoFields(freshFields, isPurchased);
              const updatedSvg = updateSvgFromFormData(baseSvgRef.current, fieldsWithAutoGenerated);
              setLivePreview(updatedSvg);
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
                test={purchasedData?.test}
                tutorial={data && 'tutorial' in data ? data.tutorial : undefined}
                templateId={isPurchased ? purchasedData?.template : undefined}
                isPurchased={Boolean(isPurchased)}
                toolPrice={(data as unknown as Record<string, number>)?.tool_price}
                keywords={data?.keywords || []}
              />
            </div>
            {/* Action Buttons - cloned from FormPanel to show in both tabs */}
            <ActionButtonsRenderer />
          </TabsContent>
        </div>
        <div style={{ display: activeTab === "preview" ? "block" : "none" }}>
          <TabsContent value="preview" forceMount className="space-y-4">
            {/* Only show skeleton if we don't have SVG text or assets are loading */}
            {(!svgText || isSvgFetching || isAssetsLoading) ? (
              <PreviewSkeleton />
            ) : (
              <div
                className={`w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl transition-all duration-700 ease-in-out ${(isSvgFetching || isAssetsLoading) ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                  }`}
              >
                <div className="min-w-[300px] inline-block max-w-full">
                  <div
                    data-svg-preview
                    className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                    style={{ willChange: 'contents' }}
                    dangerouslySetInnerHTML={{ __html: livePreview || svgText }}
                  />
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