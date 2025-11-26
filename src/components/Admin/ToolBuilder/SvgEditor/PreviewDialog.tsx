import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "@/components/Dashboard/SVGFormTranslator/FormPanel";
import { useState, useEffect } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import type { FormField } from "@/types";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svgContent: string;
  formFields: FormField[];
  templateName: string;
}

export default function PreviewDialog({ 
  open, 
  onOpenChange, 
  svgContent,
  formFields,
  templateName 
}: PreviewDialogProps) {
  const { fields, setFields, setSvgRaw, setName } = useToolStore();
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");

  // Initialize the form store when dialog opens - exactly like user side
  useEffect(() => {
    if (open && formFields.length > 0) {
      // Initialize fields with default values first - same as user side
      const initializedFields = formFields.map((field: FormField) => ({
        ...field,
        currentValue: field.defaultValue ?? "",
      }));
      
      // Process SVG with initialized fields to preserve default images - same as user side
      const newSvgText = updateSvgFromFormData(svgContent, initializedFields);
      
      // Update all state in the correct order - same as user side
      setSvgText(newSvgText);
      setSvgRaw(newSvgText);
      setName(templateName);
      setFields(formFields, false);
    }
  }, [open, formFields, svgContent, templateName, setFields, setSvgRaw, setName]);

  // Update live preview when fields change - exact same logic as user side
  useEffect(() => {
    if (!svgText || !fields || fields.length === 0) return;
    
    try {
      const updatedSvg = updateSvgFromFormData(svgText, fields);
      setLivePreview(updatedSvg);
    } catch (error) {
      console.error('Error updating SVG preview:', error);
      setLivePreview(svgText); // Fallback to original SVG
    }
  }, [fields, svgText]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[70vw] w-full h-[80vh] p-0 bg-gray-900 border-white/20 z-[999999]" 
        style={{ zIndex: 999999 }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-white">
              Preview: {templateName}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          {/* Exact same structure as user side SvgFormTranslator */}
          <Tabs defaultValue="editor" className="w-full px-0">
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
      </DialogContent>
    </Dialog>
  );
}