// Admin version of SvgFormTranslator that doesn't make API calls
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "@/components/Dashboard/SVGFormTranslator/FormPanel";
import { useEffect, useState } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import type { FormField } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { DownloadDocDialog } from "@/components/Dashboard/Documents/DownloadDoc";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState<string>("editor");

  const { 
    setFields, 
    setSvgRaw, 
    setName, 
    fields,
    svgRaw,
    name,
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

  // Render action buttons component - matches FormPanel buttons for non-purchased templates
  const ActionButtons = () => (
    <div className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-5">
      <Button
        variant="outline"
        onClick={() => {
          toast.info("Create Document feature is available in the Editor tab");
        }}
        className="py-6 px-10 hover:bg-black/50 hover:text-white"
      >
        <>
          Create Document
          <Upload className="w-4 h-4 ml-1" />
        </>
      </Button>
      <Button
        onClick={() => {
          // Trigger download dialog
          const downloadButton = document.querySelector('[data-download-doc-button]') as HTMLButtonElement;
          if (downloadButton) {
            downloadButton.click();
          }
        }}
        className="py-6 px-10 bg-primary/90 text-black hover:bg-primary hover:text-black w-full sm:w-auto"
      >
        <>
          Download Document
          <Download className="w-4 h-4 ml-1" />
        </>
      </Button>
      <DownloadDocDialog 
        svg={livePreview || svgRaw || svgText} 
        templateName={name || templateName}
      />
    </div>
  );

  // Hide FormPanel buttons when component mounts
  useEffect(() => {
    const hideFormPanelButtons = () => {
      const formPanel = document.querySelector('[data-form-panel]');
      if (formPanel) {
        // Find the buttons container (last div with pt-4 border-t)
        const buttonsContainer = formPanel.querySelector('div.pt-4.border-t.border-white\\/20.flex');
        if (buttonsContainer) {
          (buttonsContainer as HTMLElement).style.display = 'none';
        }
      }
    };

    // Hide buttons after a short delay to ensure FormPanel has rendered
    const timeout = setTimeout(hideFormPanelButtons, 100);
    return () => clearTimeout(timeout);
  }, [activeTab]);

  return (
    <div className="w-full">
      <Tabs defaultValue="editor" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor" className="space-y-4">
          <div data-form-panel>
            <FormPanel 
              test={false}
              tutorial={undefined}
              templateId={undefined}
              isPurchased={false}
            />
          </div>
          <ActionButtons />
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <div className="w-full overflow-auto p-5 bg-white/10 border border-white/20 rounded-xl">
            <div className="min-w-[300px] inline-block max-w-full">
              <div
                data-svg-preview
                className="[&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                dangerouslySetInnerHTML={{ __html: livePreview || svgText }}
              />
            </div>
          </div>
          <ActionButtons />
        </TabsContent>
      </Tabs>
    </div>
  );
}
