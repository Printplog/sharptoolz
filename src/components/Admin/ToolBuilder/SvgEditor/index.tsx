// Main SvgEditor component
import React, { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tutorial, Font, SvgPatch, FormField } from "@/types";
import { isImageElement, isTextElement } from "./utils/svgUtils";
import { regenerateSvg } from "./utils/regenerateSvg";
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
  onPatchUpdate?: (patch: SvgPatch) => void;
  onSvgReplace?: (svg: string) => void;
}

export interface SvgEditorRef {
  handleSave: () => void;
  name: string;
  openPreview: () => void;
}

const SvgEditorComponent: React.ForwardRefRenderFunction<SvgEditorRef, SvgEditorProps> = (props, ref) => {
  const {
    svgRaw,
    templateName = "",
    banner = "",
    hot = false,
    isActive = true,
    tool = "",
    tutorial,
    keywords = [],
    fonts: initialFonts = [],
    onSave,
    isLoading,
    isSvgLoading = false,
    onElementSelect,
    formFields = [],
    templateId,
    onPatchUpdate,
    onSvgReplace
  } = props;
  const {
    setInitialSvg,
    elements: elementsMap,
    elementOrder,
    selectedElementId,
    selectElement,
    updateElement: updateElementInStore,
    undo,
    redo,
    deleteElement,
    duplicateElement,
    originalSvg,
    workingSvg,
    draftElement,
    setDraftElement
  } = useSvgStore();

  const [activeTab, setActiveTab] = useState("layers");

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
  const [isReplaced, setIsReplaced] = useState(false);
  const [freshSvgContent, setFreshSvgContent] = useState<string | null>(null);
  const [isEditorDirty, setIsEditorDirty] = useState(false);

  const svgUploadRef = useRef<import("./sections/SvgUpload").SvgUploadRef>(null);

  // Navigation Intercept State
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ target: number | null } | null>(null);

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

  // Prevent accidental page reload/navigation when there are unsaved element changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditorDirty) {
        e.preventDefault();
        e.returnValue = "You have unapplied changes to an element. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditorDirty]);

  // Keep a ref so the svgRaw effect can read current selection without adding it as a dep
  const selectedElementIdRef = useRef<string | null>(null);
  useEffect(() => { selectedElementIdRef.current = selectedElementId ?? null; });

  // Sync SVG with prop — re-select the previously focused element after the store resets
  useEffect(() => {
    if (svgRaw && !originalSvg) {
      const preservedId = selectedElementIdRef.current;
      setInitialSvg(svgRaw);
      if (preservedId) {
        requestAnimationFrame(() => selectElement(preservedId));
      }
    }
  }, [svgRaw, setInitialSvg, selectElement, originalSvg]);

  useEffect(() => { setName(templateName); }, [templateName]);
  useEffect(() => { setBannerImage(banner); }, [banner]);
  useEffect(() => { setIsHot(hot); }, [hot]);
  useEffect(() => { setIsActiveState(isActive); }, [isActive]);
  useEffect(() => { setSelectedTool(tool); }, [tool]);
  useEffect(() => { setTutorialUrlState(tutorial?.url || ""); }, [tutorial]);
  useEffect(() => { setTutorialTitleState(tutorial?.title || ""); }, [tutorial]);
  useEffect(() => { setKeywordsTags(Array.isArray(keywords) ? keywords : []); }, [keywords]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
        e.preventDefault();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          deleteElement(selectedElementId);
          e.preventDefault();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedElementId) {
          duplicateElement(selectedElementId);
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, deleteElement, duplicateElement, selectedElementId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const updateElement = useCallback((index: number, updates: Partial<SvgElement>, undoable = true) => {
    const element = elements[index];
    if (!element) return;

    const internalId = element.internalId;
    if (!internalId) return;

    updateElementInStore(internalId, updates, undoable);
  }, [elements, updateElementInStore]);

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

  const handleElementSelect = useCallback((index: number | null, force = false) => {
    // If selecting a DIFFERENT element while one is locally dirty, intercept
    if (!force && isEditorDirty && index !== selectedElementIndex) {
      setPendingNavigation({ target: index });
      setShowUnsavedDialog(true);
      return;
    }

    if (index === null) {
      selectElement(null);
      setDraftElement(null);
      return;
    }

    const element = elements[index];
    if (element) {
      const id = element.internalId;
      
      // If we are selecting a DIFFERENT element, we clear the draft.
      // If it's the SAME element, we MUST preserve the draft!
      if (index !== selectedElementIndex) {
        setDraftElement(null);
      }
      
      selectElement(id || null);
      
      // Explicitly switch to inspector when an element is selected
      // This provides the "auto-open" behavior the user expects on selection,
      // but without the background effect that was locking the tabs.
      setActiveTab("inspector");

      if (onElementSelect) {
        const elementType = isTextElement(element) ? 'text' : isImageElement(element) ? 'image' : element.tag;
        onElementSelect(elementType, element.id || undefined);
      }
    }
  }, [elements, selectElement, onElementSelect, isEditorDirty, selectedElementIndex, isTextElement, isImageElement, setDraftElement]);

  const handleTabChange = useCallback((newTab: string) => {
    // We now allow tab switching without warning, even if editor is dirty
    // because the draft is persisted in the store!
    setActiveTab(newTab);
  }, []);

  const confirmNavigation = useCallback(() => {
    const action = pendingNavigation;
    setPendingNavigation(null);
    setShowUnsavedDialog(false);
    setIsEditorDirty(false); // Force clear dirty state
    
    if (!action) return;

    // Use force=true to bypass the dirty check we just confirmed to skip
    handleElementSelect(action.target, true);
  }, [pendingNavigation, handleElementSelect]);

  // Navigate to prev/next element from the inspector tab
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (elements.length === 0) return;
    const currentIdx = selectedElementIndex ?? -1;
    const nextIdx = direction === 'next'
      ? (currentIdx + 1) % elements.length
      : (currentIdx - 1 + elements.length) % elements.length;
    handleElementSelect(nextIdx);
  }, [elements, selectedElementIndex, handleElementSelect]);

  const handleElementReorder = useCallback((reorderedElements: SvgElement[]) => {
    const newOrder = reorderedElements.map(el => el.internalId!);

    // Find moved element for patch
    let movedElementId: string | null = null;
    let newIdx = -1;
    for (let i = 0; i < reorderedElements.length; i++) {
      const elId = reorderedElements[i].internalId;
      const oldId = elements[i].internalId;
      if (elId !== oldId) {
        movedElementId = reorderedElements[i].id || null; // Backend needs real ID
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

  // Working SVG is already destructured from useSvgStore at line 70

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-white/10 gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-black tracking-tighter uppercase text-white/90">Designer</h2>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/10 text-white/60"
              onClick={undo}
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-white/10 text-white/60"
              onClick={redo}
              title="Redo (Ctrl+Y)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-bold h-9 px-4 gap-2 border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Public View</span>
            </a>
          )}

          <Button onClick={() => setShowPreviewDialog(true)} variant="outline" className="gap-2 h-9 text-xs font-bold border-white/10 bg-white/5 rounded-lg shadow-sm">
            <Eye className="h-3.5 w-3.5" />
            <span>Final Preview</span>
          </Button>

          {onSave && (
            <Button
              onClick={handleSave}
              disabled={!name.trim() || isLoading}
              className="h-9 px-6 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Designer Layout */}
      <div className="flex-1 flex overflow-hidden pt-4 gap-6">
        {/* Left Side: Canvas (The Heart of the Designer) */}
        <div className="flex-1 min-w-0 bg-[#070707]/30 rounded-3xl border border-white/10 overflow-hidden relative shadow-inner">
          {isSvgLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-white/40">Initializing Canvas...</p>
              </div>
            </div>
          ) : null}

          <div className="h-full w-full">
            <SvgUpload
              ref={svgUploadRef}
              currentSvg={workingSvg}
              onSvgUpload={handleSvgUpload}
              onSelectElement={(id) => {
                const idx = elements.findIndex(el => el.id === id || el.internalId === id);
                if (idx >= 0) handleElementSelect(idx);
              }}
              elements={elements}
              activeElementId={selectedElementId}
              draftElement={draftElement}
            />
          </div>
        </div>

        {/* Right Side: Tabbed Toolbox */}
        <aside className="w-[420px] shrink-0 flex flex-col overflow-hidden bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 pt-5 pb-0">
              <TabsList className="w-full bg-black/40 border border-white/5 h-11 p-1 rounded-xl">
                <TabsTrigger value="layers" className="flex-1 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Layers
                </TabsTrigger>
                <TabsTrigger value="inspector" className="flex-1 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Inspector
                </TabsTrigger>
                <TabsTrigger value="docs" className="flex-1 rounded-lg font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Docs
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden pointer-events-auto">
              {/* Layers Tab */}
              <TabsContent value="layers" className="h-full m-0 px-5 focus-visible:outline-none flex flex-col overflow-y-auto">
                <div className="flex-1 pb-10">
                  <ElementNavigation
                    onElementClick={handleElementSelect}
                    onElementReorder={handleElementReorder}
                    selectedElementIndex={selectedElementIndex}
                    isTextElement={isTextElement}
                    isImageElement={isImageElement}
                  />
                  {!originalSvg && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/20">
                      <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest">No Layers</p>
                      <p className="text-[10px] opacity-60 mt-1">Upload an SVG to start designing</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Inspector Tab */}
              <TabsContent value="inspector" className="h-full m-0 p-5 focus-visible:outline-none overflow-y-auto">
                {selectedElementIndex !== null && elements[selectedElementIndex] ? (
                  <>
                    {/* Prev / Next navigator */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {selectedElementIndex + 1} / {elements.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleNavigate('prev')}
                          className="h-7 w-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/60 hover:bg-white/15 hover:text-white transition-all"
                          title="Previous element"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleNavigate('next')}
                          className="h-7 w-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/60 hover:bg-white/15 hover:text-white transition-all"
                          title="Next element"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <ElementEditor
                      element={elements[selectedElementIndex]}
                      index={selectedElementIndex}
                      onUpdate={updateElement}
                      onPatchUpdate={onPatchUpdate}
                      isTextElement={isTextElement}
                      isImageElement={isImageElement}
                      allElements={elements}
                      onDirtyChange={(dirty) => setIsEditorDirty(dirty)}
                      onDraftReset={() => setDraftElement(null)}
                    />
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-white/20">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Inspector</p>
                    <p className="text-[10px] opacity-60 mt-1">Select an element on the canvas to edit its properties</p>
                  </div>
                )}
              </TabsContent>

              {/* Docs Tab */}
              <TabsContent value="docs" className="h-full m-0 p-0 focus-visible:outline-none overflow-y-auto">
                <DocsPanel />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
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

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent className="bg-[#111] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Unapplied Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              You have unapplied changes to the currently selected element. 
              If you leave this element now, your draft changes will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white hover:bg-white/10 hover:text-white border-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmNavigation}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-0"
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SvgEditor = forwardRef(SvgEditorComponent);

SvgEditor.displayName = "SvgEditor";
export default SvgEditor;
