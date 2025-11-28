import { getTemplateForAdmin, getTemplateSvgForAdmin, updateTemplate } from '@/api/apiEndpoints';
import SvgEditor, { type SvgEditorRef } from '@/components/Admin/ToolBuilder/SvgEditor';
import DocsPanel from '@/components/Admin/ToolBuilder/SvgEditor/DocsPanel';
import errorMessage from '@/lib/utils/errorMessage';
import type { Template, TemplateUpdatePayload } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useRef } from 'react';
import { Save, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


export default function SvgTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const svgEditorRef = useRef<SvgEditorRef>(null);

  // Fetch template data (without SVG for faster loading)
  const { data, isLoading } = useQuery<Template>({
    queryKey: ["template", id],
    queryFn: () => getTemplateForAdmin(id as string),
    enabled: !!id, // Only run query if id exists
    refetchOnMount: false, // Don't refetch on mount to prevent flickering
  });

  // Fetch SVG separately after template data loads
  const { data: svgData, isLoading: svgLoading } = useQuery<{ svg: string }>({
    queryKey: ["template-svg", id],
    queryFn: () => getTemplateSvgForAdmin(id as string),
    enabled: !!id && !!data && !isLoading, // Only fetch SVG after template data loads
    refetchOnMount: false,
  });

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
          return result;
        }
      } catch (error) {
        console.error('Update template error:', error);
        throw error;
      }
    },
    onSuccess: async () => {
      toast.success('Template saved successfully!');
      
      // Invalidate and refetch related queries to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["templates"] }),
        queryClient.invalidateQueries({ queryKey: ["template", id] }),
        queryClient.invalidateQueries({ queryKey: ["template-svg", id] }),
        queryClient.invalidateQueries({ queryKey: ["tools"] }),
        queryClient.invalidateQueries({ queryKey: ["tool-categories"] }),
      ]);
      
      // Refetch the template data immediately to get updated form_fields
      await queryClient.refetchQueries({ queryKey: ["template", id] });
      await queryClient.refetchQueries({ queryKey: ["template-svg", id] });
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
    
    saveMutation.mutate(templateData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        <Skeleton className="h-10 w-64 bg-white/5 border border-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[600px] w-full bg-white/5 border border-white/10" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full bg-white/5 border border-white/10" />
          </div>
        </div>
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
        <div className="hidden md:flex fixed bottom-8 right-8 z-50 gap-3">
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
            onClick={() => {
              if (svgEditorRef.current?.openPreview) {
                svgEditorRef.current.openPreview();
              }
            }}
            className="bg-lime-600 border-3 border-primary text-background px-6 py-3 font-bold rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500 flex items-center gap-2"
          >
            <Eye className="h-5 w-5 group-hover:translate-x-[2px] transition-all duration-500" />
            <span>Preview</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {svgLoading || !svgData?.svg ? (
              <Skeleton className="h-[600px] w-full bg-white/5 border border-white/10" />
            ) : (
              <SvgEditor 
                ref={svgEditorRef}
                fonts={data?.fonts || []}
                svgRaw={svgData.svg} 
                templateName={data.name}
                onSave={handleSave}
                banner={data.banner}
                hot={data.hot}
                isActive={data.hot}
                tool={data.tool}
                tutorial={data.tutorial}
                keywords={data.keywords}
                isLoading={saveMutation.isPending}
                formFields={data.form_fields || []} // Pass backend form fields
                onElementSelect={() => {
                  // Simplified - no automatic section selection
                }}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <DocsPanel />
          </div>
        </div>
      </div>
    </>
  );
}
