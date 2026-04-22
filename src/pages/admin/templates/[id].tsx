import { getTemplateForAdmin, updateTemplateForAdmin, getTemplateSvgForAdmin, getTemplatesForAdmin } from '@/api/apiEndpoints';
import SvgEditor, { type SvgEditorRef } from '@/components/Admin/ToolBuilder/SvgEditor';
import errorMessage from '@/lib/utils/errorMessage';
import type { Template, TemplateUpdatePayload, SvgPatch } from '@/types';
import type { ApiError } from '@/lib/utils/errorMessage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { applySvgPatches } from "@/lib/utils/applySvgPatches";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSvgPatch } from '@/hooks/useSvgPatch';
import { useSvgStore } from '@/store/useSvgStore';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, ChevronDownIcon, AlertTriangle, Search } from 'lucide-react';


export default function SvgTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const svgEditorRef = useRef<SvgEditorRef>(null);

  const [pendingNavigateId, setPendingNavigateId] = useState<string | null>(null);
  const [showConfirmNav, setShowConfirmNav] = useState(false);
  const { patches, addPatch, clearPatch, setPatches } = useSvgPatch();
  const resetStore = useSvgStore(state => state.reset);
  const patchesInitialized = useRef(false);
  const [isDirty, setIsDirty] = useState(false);



  // Fetch template data (without SVG for faster loading)
  const { data, isLoading } = useQuery<Template>({
    queryKey: ["template", id],
    queryFn: async () => {
      const resp = await getTemplateForAdmin(id as string);
      console.log("Admin Template Data:", resp);
      return resp;
    },
    enabled: !!id,
    refetchOnMount: false,
  });

  // Reset store and patches only when the template ID changes, not after every save
  useEffect(() => {
    resetStore();
    clearPatch();
    setSvgContent("");
    patchesInitialized.current = false;
    setIsDirty(false);
  }, [id, resetStore, clearPatch]);

  // Initialize patches once per template load — skip re-runs triggered by saves
  useEffect(() => {
    if (!patchesInitialized.current && data?.svg_patches !== undefined) {
      patchesInitialized.current = true;
      if (data.svg_patches.length > 0) {
        setPatches(data.svg_patches);
      }
    }
  }, [data?.svg_patches, setPatches]);

  // Fetch all templates for the switcher

  const { data: siblingsData } = useQuery({
    queryKey: ["templates-for-admin-all"],
    queryFn: () => getTemplatesForAdmin({ page_size: 100 }),
    enabled: true,
  });

  const siblings = siblingsData?.results || [];


  const { prevTemplate, nextTemplate } = useMemo(() => {
    if (!siblings || siblings.length === 0 || !id) return { prevTemplate: null, nextTemplate: null };
    const index = siblings.findIndex(t => t.id === id);
    if (index === -1) return { prevTemplate: null, nextTemplate: null };
    
    return {
      prevTemplate: index > 0 ? siblings[index - 1] : null,
      nextTemplate: index < siblings.length - 1 ? siblings[index + 1] : null
    };
  }, [siblings, id]);

  const onNavigate = (targetId: string) => {
    if (isDirty || isReplaced) {
      setPendingNavigateId(targetId);
      setShowConfirmNav(true);
    } else {
      performNavigate(targetId);
    }
  };

  const performNavigate = (targetId: string) => {
    setSvgContent(""); // Clear current SVG to trigger fresh load for next template
    resetStore();
    clearPatch();
    setIsDirty(false);
    setPendingNavigateId(null);
    setShowConfirmNav(false);
    navigate(`/admin/templates/${targetId}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const filteredSiblings = useMemo(() => {
    if (!siblings) return [];
    if (!searchQuery.trim()) return siblings;
    return siblings.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [siblings, searchQuery]);

  const [svgContent, setSvgContent] = useState<string>("");
  const [isFetchingSvg, setIsFetchingSvg] = useState(false);
  const [isReplaced, setIsReplaced] = useState(false);
  const [syncToken, setSyncToken] = useState(0);
  const lastLoadedBaseUrl = useRef<string | null>(null);
  const baseSvgText = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.svg_url) return;

    const isNewUrl = data.svg_url !== lastLoadedBaseUrl.current;
    let cancelled = false;

    const loadAndApply = async () => {
      try {
        let text = baseSvgText.current;

        // Re-fetch only if URL changed or we don't have the base text yet
        if (isNewUrl || !text) {
          setIsFetchingSvg(true);
          console.log('[SvgTemplateEditor] Fetching base SVG:', data.svg_url);
          const res = await fetch(data.svg_url!);
          if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
          text = await res.text();
          
          if (!cancelled) {
            baseSvgText.current = text;
            lastLoadedBaseUrl.current = data.svg_url!;
          }
        }

        if (text && !cancelled) {
          // Always apply current patches to the base text
          console.log('[SvgTemplateEditor] Applying patches to base SVG. Patches count:', data.svg_patches?.length || 0);
          const patchedSvg = applySvgPatches(text, data.svg_patches || []);
          setSvgContent(patchedSvg);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Failed to load SVG via direct URL, trying backend proxy...", err);
        try {
          const text = await getTemplateSvgForAdmin(id as string);
          if (!cancelled) {
            baseSvgText.current = text;
            lastLoadedBaseUrl.current = data.svg_url!; // Mark this URL as "last loaded" even if via proxy
            const patchedSvg = applySvgPatches(text, data.svg_patches || []);
            setSvgContent(patchedSvg);
          }
        } catch (proxyErr) {
          if (!cancelled) {
            console.error("Failed to load SVG content from all sources", proxyErr);
            toast.error("Cloud storage sync failed. Please check CORS settings.");
          }
        }
      } finally {
        if (!cancelled) setIsFetchingSvg(false);
      }
    };

    loadAndApply();
    return () => { cancelled = true; };
  }, [data?.svg_url, id, data?.svg_patches]); // Removed svgContent dependency

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (templateData: TemplateUpdatePayload): Promise<Template> => {
      try {
        console.log('[SaveMutation] Starting save...');
        
        let finalSvg: string | undefined = undefined;
        let finalPatches: SvgPatch[] = [];
        const hasPatches = patches.length > 0;
        
        if (isReplaced) {
          console.log('[SaveMutation] SVG was REPLACED. Baking patches and sending full SVG.');
          // Ensure we use the freshly applied IDs version if provided, fallback to raw upload
          let bakedSvg = templateData.svg && templateData.svg.trim().length > 0 
            ? templateData.svg 
            : svgContent;
            
          console.log(`[SaveMutation] Target SVG content length: ${bakedSvg?.length || 0}`);
          
          if (hasPatches) {
            try {
              bakedSvg = applySvgPatches(bakedSvg, patches);
              console.log('[SaveMutation] Success baking patches into replaced SVG.');
            } catch (e) {
              console.error('[SaveMutation] Failed to bake patches into replaced SVG:', e);
            }
          }
          finalSvg = bakedSvg;
          finalPatches = []; // Patches are now baked into the new SVG
        } else {
          console.log('[SaveMutation] SVG not replaced. Sending incremental patches.');
          finalPatches = patches;
          // NO SVG attribute sent to avoid backend overwriting the file if it's just patches
          finalSvg = undefined; 
        }

        const isFileUpload = templateData.banner instanceof File;

        if (isFileUpload) {
          console.log('[SaveMutation] Using FormData');
          const formData = new FormData();
          formData.append('name', templateData.name);
          formData.append('hot', String(templateData.hot));
          formData.append('is_active', String(templateData.is_active));
          
          if (templateData.tool) formData.append('tool', templateData.tool);
          if (templateData.tutorialUrl) formData.append('tutorial_url', templateData.tutorialUrl);
          if (templateData.tutorialTitle) formData.append('tutorial_title', templateData.tutorialTitle);
          formData.append('keywords', JSON.stringify(templateData.keywords ?? []));
          if (templateData.banner) formData.append('banner', templateData.banner);
          
          if (templateData.fontIds?.length) {
            templateData.fontIds.forEach(id => formData.append('font_ids', id));
          }

          // SEND SVG ONLY IF REPLACED
          if (isReplaced && finalSvg) {
            const svgFile = new File([finalSvg], 'template.svg', { type: 'image/svg+xml' });
            formData.append('svg', svgFile);
          }
          
          // ALWAYS SEND PATCHES (empty if replaced/baked)
          formData.append('svg_patch', JSON.stringify(finalPatches));

          return await updateTemplateForAdmin(id as string, formData);
        } else {
          console.log('[SaveMutation] Using JSON payload');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload: any = {
            name: templateData.name,
            hot: !!templateData.hot,
            is_active: templateData.is_active !== false,
            tool: templateData.tool,
            tutorial_url: templateData.tutorialUrl,
            tutorial_title: templateData.tutorialTitle,
            keywords: templateData.keywords ?? [],
            font_ids: templateData.fontIds ?? []
          };

          if (templateData.banner) payload.banner = templateData.banner;

          // SEND SVG ONLY IF REPLACED
          if (isReplaced && finalSvg) {
            payload.svg = finalSvg;
          }
          
          // ALWAYS SEND PATCHES (empty if replaced/baked)
          payload.svg_patch = finalPatches;

          return await updateTemplateForAdmin(id as string, payload);
        }
      } catch (error: unknown) {
        console.error('[SaveMutation] Update template error:', error);
        throw error;
      }
    },
    onSuccess: async (updatedTemplate: Template) => {
      toast.success('Template saved successfully!');

      // For SVG replacement: update local content with the one we just saved (which has IDs/patches baked)
      if (isReplaced) {
        // If we have any pending patches at this exact moment (rare but possible), apply them
        setSvgContent((prev) => {
           const base = svgEditorRef.current?.handleSave ? useSvgStore.getState().workingSvg : prev;
           return patches.length > 0 ? applySvgPatches(base, patches) : base;
        });
      }
      // Reinsert server's merged patches so the dialog reflects committed state immediately
      setPatches(updatedTemplate.svg_patches || []);
      setIsReplaced(false);
      setIsDirty(false);

      // Update the React Query cache with the new template data
      queryClient.setQueryData(["template", id], (old: Template | undefined) => {
        if (!old) return updatedTemplate;
        return {
          ...old,
          ...updatedTemplate,
          fonts: updatedTemplate.fonts || old.fonts,
          tutorial: updatedTemplate.tutorial || old.tutorial,
        };
      });

      setSyncToken(prev => prev + 1);
      await queryClient.invalidateQueries({ queryKey: ["admin_templates"] });
    },
    onError: (error: any) => {
      console.error('Save template error:', error);
      // Log full error response for debugging
      if ('response' in error) {
        const apiError = error as ApiError;
        console.error('Error response:', apiError.response);
        console.error('Error data:', apiError.response?.data);
      }
      toast.error(errorMessage(error));
    }
  });

  const handleSave = (templateData: TemplateUpdatePayload & { isActive?: boolean }) => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="w-full space-y-6">
        <div className="w-full">
          {/* Navigation Header - Minimal */}
          {(prevTemplate || nextTemplate) && (
            <div className="flex items-center justify-end gap-1.5 mb-6">
              <Button
                variant="outline"
                size="icon"
                disabled={!prevTemplate}
                onClick={() => prevTemplate && onNavigate(prevTemplate.id)}
                className="bg-white/5 border-white/10 hover:bg-white/15 text-white h-9 w-9 transition-all shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <DropdownMenu onOpenChange={(open) => !open && setSearchQuery("")}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 min-w-[180px] justify-between h-9 shadow-sm"
                  >
                    <span className="truncate max-w-[140px] font-medium text-xs opacity-90">{data.name}</span>
                    <ChevronDownIcon className="h-3 w-3 opacity-40 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f1620] border-white/10 w-[240px] p-0" align="center">
                  <div className="p-2 border-b border-white/10 sticky top-0 bg-[#0f1620] z-10">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-white/30" />
                      <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 bg-white/5 border-white/10 text-xs h-8 focus-visible:ring-primary/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  <DropdownMenuLabel className="text-[10px] text-white/30 uppercase tracking-widest px-3 py-2">
                    {filteredSiblings.length} Templates
                  </DropdownMenuLabel>
                  <ScrollArea className="h-[280px]">
                    <div className="p-1">
                      {filteredSiblings.length === 0 ? (
                        <div className="py-6 text-center text-white/20 text-xs">No templates found</div>
                      ) : (
                        filteredSiblings.map((sibling) => (
                          <DropdownMenuItem
                            key={sibling.id}
                            onClick={() => onNavigate(sibling.id)}
                            className={cn(
                              "flex flex-col items-start gap-0.5 rounded-md px-3 py-2 cursor-pointer transition-colors outline-none",
                              sibling.id === id 
                                ? "bg-white/15 text-white! hover:bg-white/20 focus:bg-white/20 focus:text-white!" 
                                : "text-white/60! hover:bg-white/10 hover:text-white! focus:bg-white/10 focus:text-white!"
                            )}
                          >
                            <span className="text-sm font-medium">{sibling.name}</span>
                            <span className="text-[10px] opacity-40">{sibling.hot ? "🔥 Hot" : "Standard"}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                disabled={!nextTemplate}
                onClick={() => nextTemplate && onNavigate(nextTemplate.id)}
                className="bg-white/5 border-white/10 hover:bg-white/15 text-white h-9 w-9 transition-all shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          <SvgEditor
            ref={svgEditorRef}
            fonts={data?.fonts || []}
            svgRaw={svgContent}
            templateName={data.name}
            templateId={id}
            onSave={handleSave}
            onPatchUpdate={(patch) => { setIsDirty(true); addPatch(patch); }}
            onImportPatches={setPatches}
            patches={patches}
            syncToken={syncToken}
            onSvgReplace={(svg) => {
              console.log('[TemplateEditor] SVG replaced - marking as REPLACED');
              setSvgContent(svg);
              setIsReplaced(true);
              clearPatch();
            }}
            banner={data.banner}
            hot={data.hot}
            isActive={data.is_active}
            tool={data.tool != null && typeof data.tool === 'object' ? data.tool.id : data.tool ?? undefined}
            tutorial={data.tutorial}
            keywords={data.keywords}
            isLoading={saveMutation.isPending}
            hasUnsavedChanges={isDirty || isReplaced}
            isSvgLoading={isFetchingSvg || (!!data?.svg_url && !svgContent)} // Only show loading if we HAVE a URL but no content yet
            onElementSelect={() => {
              // Simplified - no automatic section selection
            }}
          />
        </div>
      </div>

      <AlertDialog open={showConfirmNav} onOpenChange={setShowConfirmNav}>
        <AlertDialogContent className="p-8">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-white">Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              You have unsaved edits on the current template. 
              Navigating to another template now will discard these changes forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white hover:bg-white/10 hover:text-white border-0">
              Stay Here
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingNavigateId && performNavigate(pendingNavigateId)}
              className="bg-yellow-600 text-white hover:bg-yellow-700 border-0 font-bold"
            >
              Discard & Move
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
