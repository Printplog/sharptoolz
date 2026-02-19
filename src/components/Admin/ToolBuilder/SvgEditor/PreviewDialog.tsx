import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FormPanel from "@/components/Dashboard/SVGFormTranslator/FormPanel";
import { useState, useEffect } from "react";
import useToolStore from "@/store/formStore";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import type { FormField, Font } from "@/types";
import { BASE_URL } from "@/api/apiClient";

interface PreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  svgContent: string;
  formFields: FormField[];
  templateName: string;
  fonts?: Font[];
}

export default function PreviewDialog({
  open,
  onOpenChange,
  svgContent,
  formFields,
  templateName,
  fonts = []
}: PreviewDialogProps) {
  const { fields, setFields, setSvgRaw, setName } = useToolStore();
  const [svgText, setSvgText] = useState<string>("");
  const [livePreview, setLivePreview] = useState<string>("");

  // Initialize the form store when dialog opens - use backend form fields
  // Re-initialize whenever formFields change (e.g., after template save)
  useEffect(() => {
    if (open) {
      if (formFields.length === 0) {
        // No form fields available - template needs to be saved first
        console.warn('No form fields available. Please save the template first to preview.');
        // Still show the SVG but without form fields
        const initSvg = async () => {
          let newSvgText = svgContent;
          if (fonts && fonts.length > 0) {
            newSvgText = await injectFontsIntoSVG(newSvgText, fonts, BASE_URL);
          }
          setSvgText(newSvgText);
          setSvgRaw(newSvgText);
          setName(templateName);
          setFields([], false);
        };
        initSvg();
        return;
      }

      // Use backend form fields (from template data)
      // IMPORTANT: Spread all field properties to preserve generationRule, dependsOn, etc.
      const initializedFields = formFields.map((field: FormField) => {
        // Ensure type is "gen" if generationRule exists (backend should set this, but double-check)
        const fieldType = field.generationRule ? (field.type === "gen" ? "gen" : "gen") : field.type;

        return {
          ...field, // Preserve ALL properties including generationRule, dependsOn, dateFormat, etc.
          type: fieldType, // Ensure type is "gen" if generationRule exists
          currentValue: field.currentValue ?? field.defaultValue ?? "",
        };
      });

      // Debug: Log fields with generationRule to verify they're being passed correctly
      const genFields = initializedFields.filter(f => f.generationRule || f.type === "gen");
      if (genFields.length > 0) {
        console.log('PreviewDialog: Fields with generationRule:', genFields.map(f => ({
          id: f.id,
          type: f.type,
          generationRule: f.generationRule,
          generationMode: f.generationMode,
          max: f.max,
          currentValue: f.currentValue
        })));
      } else {
        console.warn('PreviewDialog: No fields with generationRule found!', {
          totalFields: formFields.length,
          fields: formFields.map(f => ({ id: f.id, type: f.type, hasGenerationRule: !!f.generationRule }))
        });
      }

      const updateSvg = async () => {
        // Process SVG with current field values
        let newSvgText = updateSvgFromFormData(svgContent, initializedFields);

        // Inject fonts if available
        if (fonts && fonts.length > 0) {
          newSvgText = await injectFontsIntoSVG(newSvgText, fonts, BASE_URL);
        }

        // Update all state in the correct order - same as user side
        setSvgText(newSvgText);
        setSvgRaw(newSvgText);
        setName(templateName);
        setFields(initializedFields, false);
      };
      updateSvg();
    }
  }, [open, formFields, svgContent, templateName, fonts, setFields, setSvgRaw, setName]);

  // Update live preview when fields change - exact same logic as user side
  useEffect(() => {
    if (!svgText || !fields || fields.length === 0) return;

    const updatePreview = async () => {
      try {
        // Get base SVG without fonts (fonts are already injected in svgText)
        // We need to re-inject fonts after updating form data
        const baseSvg = svgContent;
        const updatedSvg = updateSvgFromFormData(baseSvg, fields);

        // Re-inject fonts after updating form data
        let finalSvg = updatedSvg;
        if (fonts && fonts.length > 0) {
          finalSvg = await injectFontsIntoSVG(updatedSvg, fonts);
        }

        setLivePreview(finalSvg);
      } catch (error) {
        console.error('Error updating SVG preview:', error);
        setLivePreview(svgText); // Fallback to original SVG
      }
    };
    updatePreview();
  }, [fields, svgText, svgContent, fonts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!w-[70%] !max-w-[70%] h-[80vh] p-0 bg-gray-900 z-[999999] overflow-hidden custom-scrollbar"
        style={{
          zIndex: 999999
        }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0 border-b border-white/10">
          <DialogTitle className="text-xl text-white">
            Preview: {templateName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {formFields.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 font-semibold mb-2">Template needs to be saved first</p>
                <p className="text-white/60 text-sm">
                  Please save the template to generate form fields from the SVG, then preview again.
                </p>
              </div>
            </div>
          ) : (
            /* 
             * REUSABLE COMPONENTS: Using the exact same components as user side
             * - FormPanel: Same component used in user-facing templates
             * - FormFieldComponent (inside FormPanel): Uses generateValue() from fieldGenerator.ts
             * - All .gen rules, auto-generation, dependencies work identically
             * This ensures admin preview matches user experience exactly
             */
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}