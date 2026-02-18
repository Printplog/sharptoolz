// Main SvgEditor component
import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import { type SvgElement } from "@/lib/utils/parseSvgElements";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTools, getFonts, addFont } from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import ElementNavigation from "./ElementNavigation";
import ElementEditor from "./ElementEditor";
import FloatingScrollButton from "./FloatingScrollButton";
import PreviewDialog from "./PreviewDialog";
import SvgUpload from "./sections/SvgUpload";
import SettingsDialog from "./sections/SettingsDialog";
import DocsPanel from "./DocsPanel";

import { Eye } from "lucide-react";
import type { Tutorial, Font } from "@/types";
import { isImageElement, isTextElement } from "./utils/svgUtils";
import { regenerateSvg } from "./utils/regenerateSvg";
import type { FormField } from "@/types";
import { CollapsiblePanel } from "./components/CollapsiblePanel";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSvgStore } from "@/store/useSvgStore";

interface SvgEditorProps {
  svgRaw: string;
  templateName?: string;
  banner?: string;
  hot?: boolean;
  isActive?: boolean;
  tool?: string;
  tutorial?: Tutorial;
  keywords?: string[];
  onSave?: (data: { name: string; svg: string; banner?: File | null; hot?: boolean; isActive?: boolean; tool?: string; tutorialUrl?: string; tutorialTitle?: string; keywords?: string[]; fontIds?: string[] }) => void;
  fonts?: Font[];
  templateId?: string;
  isLoading?: boolean;
  isSvgLoading?: boolean;
  onElementSelect?: (elementType: string, idPattern?: string) => void;
  formFields?: FormField[];
  onPatchUpdate?: (patch: { id: string; attribute: string; value: any }) => void;
  onSvgReplace?: (svg: string) => void;
}

export interface SvgEditorRef {
  handleSave: () => void;
  name: string;
  openPreview: () => void;
}

const SvgEditor = forwardRef<SvgEditorRef, SvgEditorProps>(({ svgRaw, templateName = "", banner = "", hot = false, isActive = true, tool = "", tutorial, keywords = [], fonts: initialFonts = [], onSave, isLoading, isSvgLoading = false, onElementSelect, formFields = [], templateId, onPatchUpdate, onSvgReplace }, ref) => {
  const {
    setInitialSvg,
    elements: elementsMap,
    elementOrder,
    selectedElementId,
    selectElement,
    updateElement: updateElementInStore,
    undo,
    redo,
    originalSvg
  } = useSvgStore();

  const elements = useMemo(() => elementOrder.map(id => elementsMap[id]), [elementOrder, elementsMap]);
  const selectedElementIndex = useMemo(() =>
    selectedElementId ? elementOrder.indexOf(selectedElementId) : null,
    [selectedElementId, elementOrder]);

  const [name, setName] = useState<string>(templateName);
  const [bannerImage, setBannerImage] = useState<string>(banner);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isHot, setIsHot] = useState<boolean>(hot);
  const [isActiveState, setIsActiveState] = useState<boolean>(isActive);
  const [selectedTool, setSelectedTool] = useState<string>(tool);
  const [tutorialUrlState, setTutorialUrlState] = useState<string>(tutorial?.url || "");
  const [tutorialTitleState, setTutorialTitleState] = useState<string>(tutorial?.title || "");
  const [keywordsTags, setKeywordsTags] = useState<string[]>(Array.isArray(keywords) ? keywords : []);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [draftElement, setDraftElement] = useState<SvgElement | null>(null);
  const [isReplaced, setIsReplaced] = useState(false);
  const [freshSvgContent, setFreshSvgContent] = useState<string | null>(null);

  // Layout State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [rightPanelOrder, setRightPanelOrder] = useState(['preview', 'docs']);

  // Fetch tools
  const { data: tools = [] } = useQuery({
    queryKey: ["tools"],
    queryFn: getTools,
  });

  // Fetch fonts
  const { data: fonts = [] } = useQuery<Font[]>({
    queryKey: ["fonts"],
    queryFn: getFonts,
  });

  const queryClient = useQueryClient();

  const fontUploadMutation = useMutation({
    mutationFn: (data: FormData) => addFont(data),
    onSuccess: () => {
      toast.success("Font uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["fonts"] });
    },
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const [selectedFontIds, setSelectedFontIds] = useState<string[]>(
    initialFonts.map((f) => f.id)
  );

  useEffect(() => {
    setSelectedFontIds(initialFonts.map((f) => f.id));
  }, [initialFonts]);

  // Sync with prop
  useEffect(() => {
    if (svgRaw) {
      setInitialSvg(svgRaw);
    }
  }, [svgRaw, setInitialSvg]);

  useEffect(() => { setName(templateName); }, [templateName]);
  useEffect(() => { setBannerImage(banner); }, [banner]);
  useEffect(() => { setIsHot(hot); }, [hot]);
  useEffect(() => { setIsActiveState(isActive); }, [isActive]);
  useEffect(() => { setSelectedTool(tool); }, [tool]);
  useEffect(() => { setTutorialUrlState(tutorial?.url || ""); }, [tutorial]);
  useEffect(() => { setTutorialTitleState(tutorial?.title || ""); }, [tutorial]);
  useEffect(() => { setKeywordsTags(Array.isArray(keywords) ? keywords : []); }, [keywords]);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function updateElement(index: number, updates: Partial<SvgElement>) {
    const element = elements[index];
    if (!element) return;

    const internalId = (element as any).internalId;
    if (!internalId) return;

    updateElementInStore(internalId, updates);
  }

  const handleSave = useCallback(() => {
    if (!onSave) return;
    onSave({
      name: name.trim(),
      svg: isReplaced && freshSvgContent ? freshSvgContent : "",
      banner: bannerFile,
      hot: isHot,
      isActive: isActiveState,
      tool: selectedTool && selectedTool !== "" ? selectedTool : undefined,
      tutorialUrl: tutorialUrlState.trim() || undefined,
      tutorialTitle: tutorialTitleState.trim() || undefined,
      keywords: keywordsTags,
      fontIds: selectedFontIds.length > 0 ? selectedFontIds : undefined
    });
    // Reset replaced state after successful notification to parent
    // (Actual reset should happen in parent's success handler, but this helps local UI)
  }, [onSave, name, bannerFile, isHot, isActiveState, selectedTool, tutorialUrlState, tutorialTitleState, keywordsTags, selectedFontIds, isReplaced, freshSvgContent]);

  useImperativeHandle(ref, () => ({
    handleSave,
    name,
    openPreview: () => setShowPreviewDialog(true)
  }), [handleSave, name]);

  const handleBannerUpload = (file: File) => {
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSvgUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      if (!content.trim().startsWith("<svg")) {
        toast.error("Invalid SVG file");
        return;
      }
      setInitialSvg(content);
      setIsReplaced(true);
      setFreshSvgContent(content);
      if (onSvgReplace) onSvgReplace(content);
      toast.success("SVG uploaded successfully");
    };
    reader.readAsText(file);
  };

  const handleElementSelect = useCallback((index: number | null) => {
    if (index === null) {
      selectElement(null);
      return;
    }
    const element = elements[index];
    if (element) {
      const id = (element as any).internalId;
      selectElement(id);
      setDraftElement(null);
      setIsEditorOpen(true);

      if (onElementSelect) {
        const elementType = isTextElement(element) ? 'text' : isImageElement(element) ? 'image' : element.tag;
        onElementSelect(elementType, element.id || undefined);
      }
    }
  }, [elements, selectElement, onElementSelect]);

  const handleElementReorder = useCallback((reorderedElements: SvgElement[]) => {
    const newOrder = reorderedElements.map(el => (el as any).internalId);

    // Find moved element for patch
    let movedElementId: string | null = null;
    let newIdx = -1;
    for (let i = 0; i < reorderedElements.length; i++) {
      const elId = (reorderedElements[i] as any).internalId;
      const oldId = (elements[i] as any).internalId;
      if (elId !== oldId) {
        movedElementId = (reorderedElements[i] as any).id; // Backend needs real ID
        newIdx = i;
        break;
      }
    }

    if (movedElementId && onPatchUpdate) {
      const afterElement = reorderedElements[newIdx + 1];
      const beforeElement = reorderedElements[newIdx - 1];
      onPatchUpdate({
        id: movedElementId,
        attribute: 'reorder',
        value: {
          index: newIdx,
          afterId: afterElement?.id || null,
          beforeId: beforeElement?.id || null
        }
      });
    }

    useSvgStore.getState().reorderElements(newOrder);
  }, [elements, onPatchUpdate]);

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over?.id) {
      setRightPanelOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between pb-5 border-b border-white/10 gap-4">
        <h2 className="text-xl font-semibold">SVG Editor</h2>
        <div className="flex flex-wrap items-center gap-3">
          <SettingsDialog
            name={name}
            keywords={keywordsTags}
            onNameChange={setName}
            onKeywordsChange={setKeywordsTags}
            fonts={fonts}
            selectedFontIds={selectedFontIds}
            onFontSelect={(id) => setSelectedFontIds([...selectedFontIds, id])}
            onFontRemove={(id) => setSelectedFontIds(selectedFontIds.filter(fid => fid !== id))}
            fontUploadMutation={fontUploadMutation}
            tools={tools}
            selectedTool={selectedTool}
            onToolChange={setSelectedTool}
            tutorialUrl={tutorialUrlState}
            tutorialTitle={tutorialTitleState}
            onUrlChange={setTutorialUrlState}
            onTitleChange={setTutorialTitleState}
            isHot={isHot}
            isActive={isActiveState}
            onHotChange={setIsHot}
            onActiveChange={setIsActiveState}
            bannerImage={bannerImage}
            onBannerUpload={handleBannerUpload}
            templateId={templateId}
          />

          {templateId && (
            <a
              href={`/tools/${templateId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 gap-2 border border-white/20 bg-white/5 text-white hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Public View</span>
            </a>
          )}

          <Button onClick={() => setShowPreviewDialog(true)} variant="outline" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Final Preview</span>
          </Button>

          {onSave && (
            <Button onClick={handleSave} disabled={!name.trim() || isLoading} className="min-w-32">
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start h-full">
        <div className="flex flex-col gap-4">
          {isSvgLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 w-full bg-white/5 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              <CollapsiblePanel id="elements" title="Elements" defaultOpen={true} className="max-h-[50vh] flex flex-col" forceMount={true}>
                <div className="overflow-y-auto custom-scrollbar max-h-[40vh] pr-2 pt-4 pl-4">
                  <ElementNavigation
                    onElementClick={handleElementSelect}
                    onElementReorder={handleElementReorder}
                    selectedElementIndex={selectedElementIndex}
                    isTextElement={isTextElement}
                    isImageElement={isImageElement}
                  />
                  {!originalSvg && <div className="p-8 text-center text-white/40 mt-4">Upload an SVG</div>}
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel id="editor" title="Element Editor" isOpen={isEditorOpen} onOpenChange={setIsEditorOpen}>
                {selectedElementIndex !== null && elements[selectedElementIndex] ? (
                  <ElementEditor
                    element={elements[selectedElementIndex]}
                    index={selectedElementIndex}
                    onUpdate={updateElement}
                    onLiveUpdate={setDraftElement}
                    onPatchUpdate={onPatchUpdate}
                    isTextElement={isTextElement}
                    isImageElement={isImageElement}
                    allElements={elements}
                    ref={(el: HTMLDivElement | null) => {
                      if (selectedElementIndex !== null) elementRefs.current[selectedElementIndex] = el;
                    }}
                  />
                ) : <div className="p-8 text-center text-white/40">Select an element</div>}
              </CollapsiblePanel>
            </>
          )}
        </div>

        <div className="space-y-4">
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={rightPanelOrder} strategy={verticalListSortingStrategy}>
              {rightPanelOrder.map(id => (
                <CollapsiblePanel key={id} id={id} title={id === 'preview' ? 'Preview' : 'Documentation'} dragHandle={true} defaultOpen={id === 'preview'}>
                  {id === 'preview' ? (
                    <SvgUpload
                      currentSvg={originalSvg}
                      onSvgUpload={handleSvgUpload}
                      onSelectElement={(id) => {
                        const idx = elements.findIndex(el => el.id === id);
                        if (idx >= 0) handleElementSelect(idx);
                      }}
                      elements={elements}
                      activeElementId={selectedElementId}
                      draftElement={draftElement}
                    />
                  ) : <div className="max-h-[500px] overflow-y-auto custom-scrollbar"><DocsPanel /></div>}
                </CollapsiblePanel>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
      <FloatingScrollButton show={showScrollTop} onClick={scrollToTop} />
      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        svgContent={regenerateSvg(originalSvg, elements)}
        formFields={formFields}
        templateName={name}
        fonts={fonts.filter(f => selectedFontIds.includes(f.id))}
      />
    </div>
  );
});

SvgEditor.displayName = "SvgEditor";
export default SvgEditor;
