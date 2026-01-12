import { getTemplateForAdmin, getTemplateSvgForAdmin, updateTemplate } from '@/api/apiEndpoints';
import SvgEditor, { type SvgEditorRef } from '@/components/Admin/ToolBuilder/SvgEditor';
import errorMessage from '@/lib/utils/errorMessage';
import type { Template, TemplateUpdatePayload } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';
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
  // Fetch SVG separately after template data loads
  const { data: svgData, isLoading: svgLoading } = useQuery<{ svg: string | null; url?: string }>({
    queryKey: ["template-svg", id],
    queryFn: () => getTemplateSvgForAdmin(id as string),
    enabled: !!id && !!data && !isLoading, // Only fetch SVG after template data loads
    refetchOnMount: false,
  });

  const [svgContent, setSvgContent] = useState<string>("");
  const [isFetchingSvg, setIsFetchingSvg] = useState(false);

  useEffect(() => {
    if (svgData?.url) {
      setIsFetchingSvg(true);
      fetch(svgData.url)
        .then(res => res.text())
        .then(text => {
          setSvgContent(text);
          setIsFetchingSvg(false);
        })
        .catch(err => {
          console.error("Failed to load SVG file", err);
          toast.error("Failed to load SVG content");
          setIsFetchingSvg(false);
        });
    } else if (svgData?.svg) {
      setSvgContent(svgData.svg);
    }
  }, [svgData]);

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
          formData.append('is_active', templateData.is_active ? 'true' : 'false');
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
            is_active: templateData.is_active !== undefined ? templateData.is_active : true,
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

    const payload = { ...templateData };
    if (templateData.isActive !== undefined) {
      payload.is_active = templateData.isActive;
    }

    saveMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10">
          <Skeleton className="h-7 w-48 bg-white/5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* SVG Upload skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/5" />
              <div className="border-2 border-dashed border-white/20 rounded-lg h-32 bg-white/5 animate-pulse" />
            </div>

            {/* Template Name skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-28 bg-white/5" />
              <Skeleton className="h-10 w-full bg-white/5" />
            </div>

            {/* Fonts skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 bg-white/5" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-24 bg-white/5 rounded-md" />
                ))}
              </div>
            </div>

            {/* Element Navigation skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 bg-white/5" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full bg-white/5 border border-white/10 rounded-lg" />
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
            disabled={saveMutation.isPending || svgLoading || isFetchingSvg || !svgContent}
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
            disabled={svgLoading || isFetchingSvg || !svgContent}
            className="bg-lime-600 border-3 border-primary text-background px-6 py-3 font-bold rounded-full shadow-xl shadow-white/10 cursor-pointer group hover:scale-[1.05] transition-all duration-500 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Eye className="h-5 w-5 group-hover:translate-x-[2px] transition-all duration-500" />
            <span>Preview</span>
          </button>
        </div>

        <div className="w-full">
          <SvgEditor
            ref={svgEditorRef}
            fonts={data?.fonts || []}
            svgRaw={svgContent}
            templateName={data.name}
            templateId={id}
            onSave={handleSave}
            banner={data.banner}
            hot={data.hot}
            isActive={data.is_active}
            tool={data.tool}
            tutorial={data.tutorial}
            keywords={data.keywords}
            isLoading={saveMutation.isPending}
            isSvgLoading={svgLoading || isFetchingSvg || !svgContent} // Pass SVG loading state
            formFields={data.form_fields || []} // Pass backend form fields
            onElementSelect={() => {
              // Simplified - no automatic section selection
            }}
          />
        </div>
      </div>
    </>
  );
}
