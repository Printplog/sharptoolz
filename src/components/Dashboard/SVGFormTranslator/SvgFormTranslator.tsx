// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState, useRef, useMemo } from "react";
// import parseSvgToFormFields from "@/lib/utils/parseSvgToFormFields";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import updateSvgFromFormDataOptimized from "@/lib/utils/updateSvgFromFormDataOptimized";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import { generateAutoFields } from "@/lib/utils/fieldGenerator";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { 
  getPurchasedTemplate, 
  getTemplate, 
  getPurchasedTemplateSvg,
  getTemplateSvg 
} from "@/api/apiEndpoints";
import type { FormField, PurchasedTemplate, Template } from "@/types";
import SvgFormTranslatorSkeleton from "./SvgFormTranslatorSkeleton";
import PreviewSkeleton from "./PreviewSkeleton";

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

export default function SvgFormTranslator({ isPurchased }: Props) {
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("editor");
  const pendingFieldsRef = useRef<FormField[] | null>(null);
  const isPreviewVisibleRef = useRef<boolean>(false);
  const previousFieldsRef = useRef<Map<string, string | number | boolean>>(new Map());
  const changedFieldsRef = useRef<string[]>([]);

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


  // Fetch SVG separately after template data loads
  const { data: svgData, isLoading: svgLoading } = useQuery<{ svg: string }>({
    queryKey: [isPurchased ? "purchased-template-svg" : "template-svg", id],
    queryFn: () =>
      isPurchased
        ? getPurchasedTemplateSvg(id as string)
        : getTemplateSvg(id as string),
    enabled: !!id && !!data && !isLoading, // Only fetch SVG after template data loads
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - SVG content rarely changes
  });

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
    if (svgLoading || !svgData?.svg || !data) return;
    
    // Use pending fields if available (user may have made changes before SVG loaded)
    const fieldsToUse = fields.length > 0 ? fields : (pendingFieldsRef.current || []);
    
    // Generate AUTO fields before processing SVG (skip for purchased docs)
    const fieldsWithAutoGenerated = generateAutoFields(fieldsToUse, isPurchased);
    
    // Process SVG with current field values (including AUTO generated ones)
    let newSvgText = updateSvgFromFormData(svgData.svg, fieldsWithAutoGenerated);
    
    // Inject fonts if available
    if (data.fonts && data.fonts.length > 0) {
      newSvgText = injectFontsIntoSVG(newSvgText, data.fonts);
    }
    
    // Update SVG state
    setSvgText(newSvgText);
    setSvgRaw(newSvgText);
    
    // Set initial preview immediately (no debounce on first load)
    setLivePreview(newSvgText);
    
    // Clear pending fields ref
    pendingFieldsRef.current = null;
    
    // Only run when SVG data loads, NOT when fields change
  }, [svgData, svgLoading, data, setSvgRaw]); // Removed 'fields' dependency

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
  const baseSvgRef = useRef<string>("");

  // Store base SVG (with fonts already injected) - fonts don't change during editing
  useEffect(() => {
    if (svgText) {
      if (fonts.length > 0) {
        baseSvgRef.current = injectFontsIntoSVG(svgText, fonts);
      } else {
        baseSvgRef.current = svgText;
      }
    }
  }, [svgText, fonts]);

  // Debounce SVG preview updates to improve UX - only update when preview tab is visible
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Track changed fields for optimized updates - ONLY when preview tab is active
  // Always run the hook to maintain consistent hook count, but only process when preview is active
  useEffect(() => {
    // Only track changes when on preview tab
    if (activeTab === "preview") {
      if (!fields || fields.length === 0) {
        previousFieldsRef.current.clear();
        changedFieldsRef.current = [];
        return;
      }

      const changed: string[] = [];
      const currentValues = new Map<string, string | number | boolean>();

      fields.forEach(field => {
        const currentValue = field.currentValue ?? "";
        currentValues.set(field.id, currentValue);
        
        const previousValue = previousFieldsRef.current.get(field.id);
        if (previousValue !== currentValue) {
          changed.push(field.id);
        }
      });

      // Update previous values
      previousFieldsRef.current = currentValues;
      changedFieldsRef.current = changed;
    } else {
      // On editor tab, just clear changed fields
      changedFieldsRef.current = [];
    }
  }, [fields, activeTab]);

  useEffect(() => {
    // Always run cleanup to maintain consistent hook count
    // Only process updates when preview tab is active
    if (activeTab === "preview") {
      // Clear any existing timeout and RAF
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      // Don't debounce if SVG or fields aren't ready
      if (!svgText || !fields || fields.length === 0) {
        return;
      }

      // If no fields changed, skip update
      if (changedFieldsRef.current.length === 0) {
        return;
      }

      // Set a new timeout to update preview after 500ms of inactivity
      debounceTimeoutRef.current = setTimeout(() => {
        // Use requestAnimationFrame for smoother updates
        rafRef.current = requestAnimationFrame(() => {
          try {
            // Generate AUTO fields before updating preview (skip for purchased docs)
            const fieldsWithAutoGenerated = generateAutoFields(fields, isPurchased);
            
            // Use current live preview as base for incremental updates (much faster)
            // If no preview exists yet, use base SVG with fonts
            const baseForUpdate = livePreview || baseSvgRef.current || svgText;
            
            // OPTIMIZED: Only update changed fields instead of all fields
            const updatedSvg = updateSvgFromFormDataOptimized(
              baseForUpdate, // Use current preview as base (incremental updates)
              fieldsWithAutoGenerated,
              changedFieldsRef.current
            );
            
            setLivePreview(updatedSvg);
          } catch (error) {
            console.error('[SvgFormTranslator] ❌ Error updating SVG preview:', error);
            // Fallback to full update if optimized version fails
            try {
              const fieldsWithAutoGenerated = generateAutoFields(fields, isPurchased);
              const baseSvg = baseSvgRef.current || svgText;
              const updatedSvg = updateSvgFromFormData(baseSvg, fieldsWithAutoGenerated);
              setLivePreview(updatedSvg);
            } catch (fallbackError) {
              console.error('[SvgFormTranslator] ❌ Fallback also failed:', fallbackError);
              setLivePreview(svgText);
            }
          }
        });
      }, 500); // 500ms debounce delay for better performance
    }

    // Cleanup timeout and RAF on unmount or when dependencies change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [fields, svgText, fonts, activeTab, livePreview, isPurchased]);

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
      <Tabs 
        defaultValue="editor" 
        className="w-full px-0"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          // Mark preview as visible when switching to preview tab
          if (value === "preview") {
            isPreviewVisibleRef.current = true;
            // Trigger immediate update when switching to preview
            if (baseSvgRef.current && fields.length > 0) {
              // Generate AUTO fields before preview (skip for purchased docs)
              const fieldsWithAutoGenerated = generateAutoFields(fields, isPurchased);
              // Use full update on initial tab switch to ensure everything is correct
              const updatedSvg = updateSvgFromFormData(baseSvgRef.current, fieldsWithAutoGenerated);
              setLivePreview(updatedSvg);
              // Reset previous values to current state after full update
              const currentValues = new Map<string, string | number | boolean>();
              fields.forEach(field => {
                currentValues.set(field.id, field.currentValue ?? "");
              });
              previousFieldsRef.current = currentValues;
              changedFieldsRef.current = [];
            }
          } else {
            isPreviewVisibleRef.current = false;
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
              />
            </div>
            {/* Action Buttons - cloned from FormPanel to show in both tabs */}
            <ActionButtonsRenderer />
          </TabsContent>
        </div>
        <TabsContent value="preview" className="space-y-4">
          {svgLoading || !svgText ? (
            <PreviewSkeleton />
          ) : (
            <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
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
      </Tabs>
    </div>
  );
}