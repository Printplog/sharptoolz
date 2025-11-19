import { getTemplateForAdmin, updateTemplate } from '@/api/apiEndpoints';
import SvgEditor, { type SvgEditorRef } from '@/components/Admin/ToolBuilder/SvgEditor';
import DocsPanel from '@/components/Admin/ToolBuilder/SvgEditor/DocsPanel';
import errorMessage from '@/lib/utils/errorMessage';
import type { Template, TemplateUpdatePayload } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useRef, useState } from 'react';
import { Save, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminSvgFormTranslator from '@/components/Admin/ToolBuilder/SvgEditor/AdminSvgFormTranslator';


export default function SvgTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const svgEditorRef = useRef<SvgEditorRef>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch template data
  const { data, isLoading } = useQuery<Template>({
    queryKey: ["template", id],
    queryFn: () => getTemplateForAdmin(id as string),
    enabled: !!id, // Only run query if id exists
    refetchOnMount: false, // Don't refetch on mount to prevent flickering
  });

  console.log(data);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (templateData: TemplateUpdatePayload) => {
      try {
        // If there's a banner file, use FormData
        if (templateData.banner) {
          const formData = new FormData();
          formData.append('name', templateData.name);
          formData.append('svg', templateData.svg);
          formData.append('hot', templateData.hot ? 'true' : 'false');
          if (templateData.tool) {
            formData.append('tool', templateData.tool);
          }
          if (templateData.tutorialUrl) {
            formData.append('tutorial_url', templateData.tutorialUrl);
          }
          if (templateData.tutorialTitle) {
            formData.append('tutorial_title', templateData.tutorialTitle);
          }
          formData.append('keywords', JSON.stringify(templateData.keywords ?? []));
          formData.append('banner', templateData.banner);
          if (templateData.fontIds && templateData.fontIds.length > 0) {
            templateData.fontIds.forEach((fontId) => {
              formData.append('font_ids', fontId);
            });
          }
          const result = await updateTemplate(id as string, formData);
          console.log('FormData update result:', result);
          return result;
        } else {
          // Otherwise, send as JSON
          const result = await updateTemplate(id as string, {
            name: templateData.name,
            svg: templateData.svg,
            hot: templateData.hot || false,
            tool: templateData.tool || undefined,
            tutorial_url: templateData.tutorialUrl || undefined,
            tutorial_title: templateData.tutorialTitle || undefined,
            keywords: templateData.keywords ?? [],
            font_ids: templateData.fontIds || []
          });
          console.log('JSON update result:', result);
          return result;
        }
      } catch (error) {
        console.error('Update template error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Template saved successfully:', data);
      toast.success('Template saved successfully!');
      
      // Invalidate related queries but not the current template to avoid disappearing
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["tools"] });
      queryClient.invalidateQueries({ queryKey: ["tool-categories"] });
      
      // Optionally navigate back or refresh
      // navigate('/admin/templates');
    },
    onError: (error: Error) => {
      console.error('Save template error:', error);
      toast.error(errorMessage(error));
    }
  });

  const handleSave = (templateData: TemplateUpdatePayload & { isActive?: boolean }) => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    
    console.log('Saving template data:', templateData);
    saveMutation.mutate(templateData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">Loading template...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Template not found</h3>
          <p className="text-muted-foreground">The requested template could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto relative">
        {/* Floating Action Buttons */}
        <div className="fixed bottom-8 right-8 z-[9999999] flex gap-3">
          {/* Floating Save Button */}
          <button
            onClick={() => {
              if (svgEditorRef.current?.handleSave) {
                svgEditorRef.current.handleSave();
              }
            }}
            disabled={saveMutation.isPending}
            className="bg-primary text-background px-6 py-3 font-bold rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Save className="h-5 w-5 group-hover:rotate-12 transition-all duration-500" />
            <span>{saveMutation.isPending ? "Saving..." : "Save Template"}</span>
          </button>

          {/* Floating Preview Button */}
          <button
            onClick={() => setShowPreview(true)}
            className="bg-lime-600 border-3 border-primary text-background px-6 py-3 font-bold rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500 flex items-center gap-2"
          >
            <Eye className="h-5 w-5 group-hover:translate-x-[2px] transition-all duration-500" />
            <span>Preview</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SvgEditor 
              ref={svgEditorRef}
              fonts={data?.fonts || []}
              svgRaw={data.svg} 
              templateName={data.name}
              onSave={handleSave}
              banner={data.banner}
              hot={data.hot}
              isActive={data.hot}
              tool={data.tool}
              tutorial={data.tutorial}
              keywords={data.keywords}
              isLoading={saveMutation.isPending}
              onElementSelect={() => {
                // Simplified - no automatic section selection
              }}
            />
          </div>
          <div className="lg:col-span-1">
            <DocsPanel />
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent 
          className="max-h-[90vh] overflow-hidden"
          style={{ width: '70vw', maxWidth: '70vw' }}
        >
          <DialogHeader>
            <DialogTitle>Template Preview - {data.name}</DialogTitle>
            <DialogDescription>
              Preview how this template will look and work for users
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-120px)] custom-scrollbar">
            <AdminSvgFormTranslator 
              svgContent={data.svg} 
              formFields={data.form_fields} 
              templateName={data.name}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
