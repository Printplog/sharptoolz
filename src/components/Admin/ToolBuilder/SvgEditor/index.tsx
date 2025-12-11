// Main SvgEditor component
import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import parseSvgElements, { type SvgElement } from "@/lib/utils/parseSvgElements";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTools, getFonts, addFont } from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import ElementNavigation from "./ElementNavigation";
import ElementEditor from "./ElementEditor";
import BannerUpload from "./BannerUpload";
import FloatingScrollButton from "./FloatingScrollButton";
import PreviewDialog from "./PreviewDialog";
import SvgUpload from "./sections/SvgUpload";
import MetadataSection from "./sections/MetadataSection";
import FontSelection from "./sections/FontSelection";
import ToolSelection from "./sections/ToolSelection";
import TutorialSection from "./sections/TutorialSection";
import TemplateToggles from "./sections/TemplateToggles";
import type { Tutorial, Font } from "@/types";
import { isImageElement, isTextElement, filterEditableElements } from "./utils/svgUtils";
import { regenerateSvg } from "./utils/regenerateSvg";
import type { FormField } from "@/types";

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
  isLoading?: boolean;
  isSvgLoading?: boolean; // Loading state for SVG data
  onElementSelect?: (elementType: string, idPattern?: string) => void;
  formFields?: FormField[]; // Backend form fields from template
}

export interface SvgEditorRef {
  handleSave: () => void;
  name: string;
  openPreview: () => void;
}

const SvgEditor = forwardRef<SvgEditorRef, SvgEditorProps>(({ svgRaw, templateName = "", banner = "", hot = false, isActive = true, tool = "", tutorial, keywords = [], fonts: initialFonts = [], onSave, isLoading, isSvgLoading = false, onElementSelect, formFields = [] }, ref) => {
  const [currentSvg, setCurrentSvg] = useState<string>(svgRaw);
  const [elements, setElements] = useState<SvgElement[]>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
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

  // Fetch tools for the dropdown
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

  // Font upload mutation
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

  // Font selection state
  const [selectedFontIds, setSelectedFontIds] = useState<string[]>(
    initialFonts.map((f) => f.id)
  );

  useEffect(() => {
    setSelectedFontIds(initialFonts.map((f) => f.id));
  }, [initialFonts]);

  useEffect(() => {
    const parsed = parseSvgElements(currentSvg);
    // Filter out non-editable elements completely - these should not appear in the editor
    const editableElements = filterEditableElements(parsed);
    setElements(editableElements);
    
    // Reset refs array
    elementRefs.current = new Array(editableElements.length).fill(null);
  }, [currentSvg]);

  useEffect(() => {
    setName(templateName);
  }, [templateName]);

  useEffect(() => {
    setBannerImage(banner);
    // If banner is a URL (not base64), we don't need to set bannerFile
    // Only set bannerFile if it's a new upload
  }, [banner]);

  useEffect(() => {
    setIsHot(hot);
  }, [hot]);

  useEffect(() => {
    setIsActiveState(isActive);
  }, [isActive]);

  useEffect(() => {
    setSelectedTool(tool);
  }, [tool]);

  useEffect(() => {
    setTutorialUrlState(tutorial?.url || "");
  }, [tutorial]);

  useEffect(() => {
    setTutorialTitleState(tutorial?.title || "");
  }, [tutorial]);

  useEffect(() => {
    setKeywordsTags(Array.isArray(keywords) ? keywords : []);
  }, [keywords]);

  // Handle scroll events for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function updateElement(index: number, updates: Partial<SvgElement>) {
    const updated = [...elements];
    updated[index] = { ...updated[index], ...updates };
    
    // Ensure ID is properly updated in attributes
    if (updates.id !== undefined) {
      updated[index].attributes.id = updates.id;
    }
    
    setElements(updated);
  }

  useEffect(() => {
    setCurrentSvg(svgRaw);
  }, [svgRaw]);


  const handleSave = useCallback(() => {
    if (!onSave) return;
    
    // Regenerate SVG and get the updated version immediately
    const updatedSvg = regenerateSvg(currentSvg, elements);
    
    onSave({
      name: name.trim(),
      svg: updatedSvg,
      banner: bannerFile,
      hot: isHot,
      isActive: isActiveState,
      tool: selectedTool && selectedTool !== "" ? selectedTool : undefined,
      tutorialUrl: tutorialUrlState.trim() || undefined,
      tutorialTitle: tutorialTitleState.trim() || undefined,
      keywords: keywordsTags,
      fontIds: selectedFontIds.length > 0 ? selectedFontIds : undefined
    });
  }, [onSave, name, bannerFile, isHot, isActiveState, selectedTool, tutorialUrlState, tutorialTitleState, keywordsTags, selectedFontIds, elements, currentSvg]);

  // Expose methods and state via ref
  useImperativeHandle(ref, () => ({
    handleSave,
    name,
    openPreview: () => setShowPreviewDialog(true)
  }), [handleSave, name]);

  const handleBannerUpload = (file: File) => {
    setBannerFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setBannerImage(base64);
    };
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
      setCurrentSvg(content);
      setSelectedElementIndex(null);
      toast.success("SVG uploaded successfully");
    };
    reader.readAsText(file);
  };

  const handleElementSelect = useCallback((index: number) => {
    setSelectedElementIndex(index);
    
    // Notify parent component about selection for docs context
    if (onElementSelect && index >= 0 && index < elements.length) {
      const element = elements[index];
      const elementType = isTextElement(element) ? 'text' : 
                        isImageElement(element) ? 'image' : element.tag;
      
      // Extract ID pattern for documentation context
      let idPattern;
      if (element.id) {
        idPattern = element.id;
      }
      
      onElementSelect(elementType, idPattern);
    }
  }, [elements, onElementSelect]);

  const handleElementReorder = useCallback((reorderedElements: SvgElement[]) => {
    const currentlySelectedElement = selectedElementIndex !== null ? elements[selectedElementIndex] : null;
    
    setElements(reorderedElements);
    
    // If an element was selected, try to find its new index after reordering
    if (currentlySelectedElement) {
      // More robust matching - use multiple criteria to find the exact element
      const newIndex = reorderedElements.findIndex(el => {
        // Primary match: exact ID and tag
        if (el.id && currentlySelectedElement.id && 
            el.id === currentlySelectedElement.id && 
            el.tag === currentlySelectedElement.tag) {
          return true;
        }
        
        // Secondary match: for elements without IDs, match by tag and content
        if (!el.id && !currentlySelectedElement.id &&
            el.tag === currentlySelectedElement.tag &&
            el.innerText === currentlySelectedElement.innerText) {
          return true;
        }
        
        // Tertiary match: for image elements, match by href attribute
        if (el.tag === 'image' && currentlySelectedElement.tag === 'image' &&
            el.attributes.href === currentlySelectedElement.attributes.href) {
          return true;
        }
        
        return false;
      });
      
      setSelectedElementIndex(newIndex >= 0 ? newIndex : null);
    }
  }, [selectedElementIndex, elements]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <h2 className="text-xl font-semibold">SVG Editor</h2>
      </div>

      {/* SVG Upload */}
      <SvgUpload currentSvg={currentSvg} onSvgUpload={handleSvgUpload} />

      {/* Template Name & Keywords */}
      <MetadataSection 
        name={name}
        keywords={keywordsTags}
        onNameChange={setName}
        onKeywordsChange={setKeywordsTags}
      />

      {/* Font Selection */}
      <FontSelection
        fonts={fonts}
        selectedFontIds={selectedFontIds}
        onFontSelect={(fontId) => setSelectedFontIds([...selectedFontIds, fontId])}
        onFontRemove={(fontId) => setSelectedFontIds(selectedFontIds.filter(id => id !== fontId))}
        fontUploadMutation={fontUploadMutation}
      />

      {/* Tool Selection */}
      <ToolSelection
        tools={tools}
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
      />

      {/* Tutorial Section */}
      <TutorialSection
        tutorialUrl={tutorialUrlState}
        tutorialTitle={tutorialTitleState}
        onUrlChange={setTutorialUrlState}
        onTitleChange={setTutorialTitleState}
      />

      {/* Hot & Active Template Toggles */}
      <TemplateToggles
        isHot={isHot}
        isActive={isActiveState}
        onHotChange={setIsHot}
        onActiveChange={setIsActiveState}
      />

      {/* Banner Upload */}
      <BannerUpload 
        bannerImage={bannerImage}
        onUpload={handleBannerUpload}
      />

      {/* Element Selection - Show loading skeleton when SVG is loading */}
      {isSvgLoading ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-white/5 rounded animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 w-full bg-white/5 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ElementNavigation 
            elements={elements}
            onElementClick={handleElementSelect}
            onElementReorder={handleElementReorder}
            selectedElementIndex={selectedElementIndex}
            isTextElement={isTextElement}
            isImageElement={isImageElement}
          />

          {/* Show only selected element */}
          {selectedElementIndex !== null && elements[selectedElementIndex] && (
            <div className="space-y-4">
              <ElementEditor
                element={elements[selectedElementIndex]}
                index={selectedElementIndex}
                onUpdate={updateElement}
                isTextElement={isTextElement}
                isImageElement={isImageElement}
                allElements={elements}
                ref={(el: HTMLDivElement | null) => {
                  elementRefs.current[selectedElementIndex] = el;
                }}
              />
            </div>
          )}

          {/* Show message when no element is selected */}
          {selectedElementIndex === null && (
            <div className="text-center py-8 text-white/60">
              <p>Select an element from above to start editing</p>
            </div>
          )}
        </>
      )}

      {/* Action Buttons at Bottom */}
      <div className="flex justify-center gap-4 pt-6 border-t border-white/10">
        {/* Preview Button */}
        <Button 
          onClick={() => setShowPreviewDialog(true)}
          variant="outline"
          className="min-w-32 px-8 py-2"
        >
          Preview
        </Button>
        
        {/* Save Template Button */}
        {onSave && (
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || isLoading}
            className="min-w-32 px-8 py-2"
          >
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      <FloatingScrollButton show={showScrollTop} onClick={scrollToTop} />

      {/* Preview Dialog - Use regenerated SVG with all current edits and backend form fields */}
      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        svgContent={regenerateSvg(currentSvg, elements)}
        formFields={formFields} // Use backend form fields instead of extracting from elements
        templateName={name}
        fonts={fonts.filter(f => selectedFontIds.includes(f.id))}
      />
    </div>
  );
});

SvgEditor.displayName = "SvgEditor";

export default SvgEditor;
