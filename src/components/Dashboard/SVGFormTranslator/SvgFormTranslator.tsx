// components/SvgFormTranslator.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "./FormPanel";
import { useEffect, useState, useRef, useMemo } from "react";
// import parseSvgToFormFields from "@/lib/utils/parseSvgToFormFields";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
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

interface Props {
  isPurchased?: boolean;
}

export default function SvgFormTranslator({ isPurchased }: Props) {
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");
  const pendingFieldsRef = useRef<FormField[] | null>(null);

  const { 
    setFields, 
    setSvgRaw, 
    setName, 
    fields, 
  } = useToolStore();
  
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

  // Process SVG once it loads and apply any pending field changes
  useEffect(() => {
    if (svgLoading || !svgData?.svg || !data) return;
    
    // Use pending fields if available (user may have made changes before SVG loaded)
    const fieldsToUse = fields.length > 0 ? fields : (pendingFieldsRef.current || []);
    
    // Process SVG with current field values
    let newSvgText = updateSvgFromFormData(svgData.svg, fieldsToUse);
    
    // Inject fonts if available
    if (data.fonts && data.fonts.length > 0) {
      newSvgText = injectFontsIntoSVG(newSvgText, data.fonts);
    }
    
    // Update SVG state
    setSvgText(newSvgText);
    setSvgRaw(newSvgText);
    
    // Clear pending fields ref
    pendingFieldsRef.current = null;
    
  }, [svgData, svgLoading, data, fields, setSvgRaw]);

  const purchasedData = data as PurchasedTemplate;

  // Separate effect for status fields to avoid conflicts
  useEffect(() => {
    if (isLoading || !data) return;
    
    if (isPurchased) {
      // Status and error message are now handled by the SVG template fields
    }
    
  }, [data, isLoading, isPurchased, purchasedData?.status, purchasedData?.error_message]);

  // Memoize font injection to avoid recalculating
  const fonts = useMemo(() => data?.fonts || [], [data?.fonts]);

  // Update live preview when fields or svgText change - memoized
  const livePreviewSvg = useMemo(() => {
    if (!svgText || !fields || fields.length === 0) return "";
    
    try {
      let updatedSvg = updateSvgFromFormData(svgText, fields);
      
      // Inject fonts if available
      if (fonts.length > 0) {
        updatedSvg = injectFontsIntoSVG(updatedSvg, fonts);
      }
      
      return updatedSvg;
    } catch (error) {
      console.error('Error updating SVG preview:', error);
      return svgText; // Fallback to original SVG
    }
  }, [fields, svgText, fonts]);

  useEffect(() => {
    setLivePreview(livePreviewSvg);
  }, [livePreviewSvg]);

  // Handle loading state - show skeleton while template data loads
  if (isLoading) {
    return <SvgFormTranslatorSkeleton />;
  }

  // Handle error state
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
      <Tabs defaultValue="editor" className="w-full px-0">
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="editor">
          <FormPanel 
            test={purchasedData?.test} 
            tutorial={data && 'tutorial' in data ? data.tutorial : undefined}
            templateId={isPurchased ? purchasedData?.template : undefined}
            isPurchased={Boolean(isPurchased)}
          />
        </TabsContent>
        <TabsContent value="preview">
          {svgLoading || !svgText ? (
            <PreviewSkeleton />
          ) : (
            <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
              <div className="min-w-[300px] inline-block max-w-full">
                <div
                  data-svg-preview
                  className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: livePreview || svgText }}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}