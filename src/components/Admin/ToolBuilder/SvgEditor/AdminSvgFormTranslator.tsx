// Admin version of SvgFormTranslator that doesn't make API calls
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "@/components/Dashboard/SVGFormTranslator/FormPanel";
import { useEffect, useState } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import type { FormField } from "@/types";

interface AdminSvgFormTranslatorProps {
  svgContent: string;
  formFields: FormField[];
  templateName: string;
} 

export default function AdminSvgFormTranslator({ 
  svgContent, 
  formFields, 
  templateName 
}: AdminSvgFormTranslatorProps) {
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");

  const { 
    setFields, 
    setSvgRaw, 
    setName, 
    fields,
    svgRaw,
  } = useToolStore();

  // Initialize with provided data instead of making API calls
  useEffect(() => {
    if (!svgContent || !formFields) return;
    
    // Initialize fields with default values
    const initializedFields = formFields.map((field: FormField) => ({
      ...field,
      currentValue: field.defaultValue ?? "",
    }));
    
    // Process SVG with initialized fields
    const newSvgText = updateSvgFromFormData(svgContent, initializedFields);
    
    // Update all state
    setSvgText(newSvgText);
    setSvgRaw(newSvgText);
    setName(templateName);
    setFields(formFields, false);
    
  }, [svgContent, formFields, templateName, setSvgRaw, setName, setFields]);

  // Update live preview when fields change
  useEffect(() => {
    if (fields && svgRaw) {
      const updatedSvg = updateSvgFromFormData(svgRaw, fields);
      setLivePreview(updatedSvg);
    }
  }, [fields, svgRaw]);

  return (
    <div className="w-full">
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor">
          <FormPanel 
            test={false}
            tutorial={undefined}
            templateId={undefined}
            isPurchased={false}
          />
        </TabsContent>
        
        <TabsContent value="preview">
          <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
            <div className="min-w-[300px] inline-block max-w-full">
              <div
                data-svg-preview
                className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: livePreview || svgText }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
