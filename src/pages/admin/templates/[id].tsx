import { getTemplateForAdmin, updateTemplateForAdmin } from '@/api/apiEndpoints';
import SvgEditor, { type SvgEditorRef } from '@/components/Admin/ToolBuilder/SvgEditor';
import errorMessage from '@/lib/utils/errorMessage';
import type { Template, TemplateUpdatePayload } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import { useRef, useState, useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSvgPatch } from '@/hooks/useSvgPatch';
import type { SvgPatch } from '@/types';


export default function SvgTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const svgEditorRef = useRef<SvgEditorRef>(null);
  const { patches, addPatch, clearPatch } = useSvgPatch();

  // Fetch template data (without SVG for faster loading)
  const { data, isLoading } = useQuery<Template>({
    queryKey: ["template", id],
    queryFn: async () => {
      const resp = await getTemplateForAdmin(id as string);
      console.log("Admin Template Data:", resp);
      return resp;
    },
    enabled: !!id, // Only run query if id exists
    refetchOnMount: false, // Don't refetch on mount to prevent flickering
  });

  const [svgContent, setSvgContent] = useState<string>("");
  const [isFetchingSvg, setIsFetchingSvg] = useState(false);

  useEffect(() => {
    // Only fetch the base file if it exists and we haven't loaded it yet
    if (data?.svg_url && !svgContent) {
      setIsFetchingSvg(true);
      fetch(data.svg_url)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.text();
        })
        .then(text => {
          // FIGMA-STYLE: Merge base file with DB patches on initial load
          const patchedSvg = applySvgPatches(text, data.svg_patches || []);
          setSvgContent(patchedSvg);
          setIsFetchingSvg(false);
          console.log('[SvgTemplateEditor] Base SVG loaded and patched.');
        })
        .catch(err => {
          console.error("Failed to load SVG file from URL", err);
          toast.error("Failed to load SVG content from cloud storage");
          setIsFetchingSvg(false);
        });
    }
  }, [data?.svg_url]); // Only re-run if the URL changes

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (templateData: TemplateUpdatePayload & { svg_patch?: SvgPatch[] }): Promise<Template> => {
      try {
        console.log('[SaveMutation] Starting save...');
        console.log('[SaveMutation] Current patches:', patches);
        console.log('[SaveMutation] Patches count:', patches.length);

        // If there's a banner file, use FormData
        if (templateData.banner instanceof File) { // Corrected check
          console.log('[SaveMutation] Using FormData (banner upload)');
          const formData = new FormData();
          formData.append('name', templateData.name);
          // PATCH-ONLY MODE: Only send patches, never full SVG
          if (patches.length > 0) {
            console.log('[SaveMutation] Adding patches to FormData:', patches);
            formData.append('svg_patch', JSON.stringify(patches));
          } else {
            console.log('[SaveMutation] No patches to send (metadata-only update)');
          }
          // If no patches, we're only updating metadata (name, banner, etc.)

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
          const result = await updateTemplateForAdmin(id as string, formData);
          return result;
        } else {
          console.log('[SaveMutation] Using JSON payload');
          // Otherwise, send as JSON
          const payload: any = {
            name: templateData.name,
            hot: templateData.hot || false,
            is_active: templateData.is_active !== undefined ? templateData.is_active : true,
            tool: templateData.tool || undefined,
            tutorial_url: templateData.tutorialUrl || undefined,
            tutorial_title: templateData.tutorialTitle || undefined,
            keywords: templateData.keywords ?? [],
            font_ids: templateData.fontIds || []
          };

          // Conditionally add banner if it's a string (meaning it's a URL for an existing banner)
          if (typeof templateData.banner === 'string') {
            payload.banner = templateData.banner;
          }

          // PATCH-ONLY MODE: Only send patches, never full SVG
          if (patches.length > 0) {
            console.log('[SaveMutation] Adding patches to JSON payload:', patches);
            payload.svg_patch = patches;
          } else {
            console.log('[SaveMutation] No patches to send (metadata-only update)');
          }
          // If no patches, we're only updating metadata

          console.log('[SaveMutation] Final payload:', payload);
          const result = await updateTemplateForAdmin(id as string, payload);
          return result;
        }
      } catch (error) {
        console.error('[SaveMutation] Update template error:', error);
        throw error;
      }
    },
    onSuccess: async (updatedTemplate: Template) => {
      toast.success('Template saved successfully!');

      // FIGMA-STYLE INSTANT UPDATE:
      // Instead of re-fetching the whole SVG file, we apply the patches we JUST sent
      // to the current locally loaded SVG content. 
      if (patches.length > 0) {
        setSvgContent((prev) => applySvgPatches(prev, patches));
        console.log('[SaveMutation] Local SVG updated with applied patches.');
      }

      clearPatch(); // Clear local pending patches after successful save

      // Update the React Query cache with the new template data (includes new svg_patches)
      queryClient.setQueryData(["template", id], (old: Template | undefined) => {
        if (!old) return updatedTemplate;
        return {
          ...old,
          ...updatedTemplate, // This will have the merged svg_patches from the backend
          fonts: updatedTemplate.fonts || old.fonts,
          tutorial: updatedTemplate.tutorial || old.tutorial,
        };
      });

      // Refresh other templates lists
      await queryClient.invalidateQueries({ queryKey: ["templates"] });
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

    const payload: any = { ...templateData };
    if (templateData.isActive !== undefined) {
      payload.is_active = templateData.isActive;
    }

    // Patches are handled in the mutation function
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
            disabled={saveMutation.isPending || isFetchingSvg || !svgContent}
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
            disabled={isFetchingSvg || !svgContent}
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
            onPatchUpdate={addPatch}
            banner={data.banner}
            hot={data.hot}
            isActive={data.is_active}
            tool={typeof data.tool === 'object' ? data.tool.id : data.tool}
            tutorial={data.tutorial}
            keywords={data.keywords}
            isLoading={saveMutation.isPending}
            isSvgLoading={isFetchingSvg || !svgContent} // Pass SVG loading state
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
