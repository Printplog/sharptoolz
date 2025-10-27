// Main SvgEditor component
import { useEffect, useState, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import parseSvgElements, { type SvgElement } from "@/lib/utils/parseSvgElements";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getTools } from "@/api/apiEndpoints";
import ElementNavigation from "./ElementNavigation";
import ElementEditor from "./ElementEditor";
import BannerUpload from "./BannerUpload";
import FloatingScrollButton from "./FloatingScrollButton";
import PreviewDialog from "./PreviewDialog";
import type { Tutorial } from "@/types";

interface SvgEditorProps {
  svgRaw: string;
  templateName?: string;
  banner?: string;
  hot?: boolean;
  isActive?: boolean;
  tool?: string;
  tutorial?: Tutorial;
  onSave?: (data: { name: string; svg: string; banner?: File | null; hot?: boolean; isActive?: boolean; tool?: string; tutorialUrl?: string; tutorialTitle?: string }) => void;
  isLoading?: boolean;
  onElementSelect?: (elementType: string, idPattern?: string) => void;
}

export interface SvgEditorRef {
  handleSave: () => void;
  name: string;
}

const SvgEditor = forwardRef<SvgEditorRef, SvgEditorProps>(({ svgRaw, templateName = "", banner = "", hot = false, isActive = true, tool = "", tutorial, onSave, isLoading, onElementSelect }, ref) => {
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch tools for the dropdown
  const { data: tools = [] } = useQuery({
    queryKey: ["tools"],
    queryFn: getTools,
  });

  console.log(tools);

  useEffect(() => {
    const parsed = parseSvgElements(svgRaw);
    // Filter out non-editable elements completely - these should not appear in the editor
    const nonEditableTags = ['defs', 'style', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'filter', 'feGaussianBlur', 'feOffset', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode'];
    const editableElements = parsed.filter(el => !nonEditableTags.includes(el.tag));
    setElements(editableElements);
    
    // Reset refs array
    elementRefs.current = new Array(editableElements.length).fill(null);
  }, [svgRaw]);

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

  // Handle scroll events for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function updateElement(index: number, updates: Partial<SvgElement>) {
    console.log('=== UPDATE ELEMENT DEBUG ===');
    console.log('Updating element at index:', index);
    console.log('Updates:', updates);
    console.log('Current element:', elements[index]);
    
    const updated = [...elements];
    updated[index] = { ...updated[index], ...updates };
    
    // Ensure ID is properly updated in attributes
    if (updates.id !== undefined) {
      updated[index].attributes.id = updates.id;
    }
    
    console.log('Updated element:', updated[index]);
    setElements(updated);
  }

  function regenerateSvg(): string {
    try {
      console.log('Regenerating SVG - elements count:', elements.length);
      
      // Parse the original SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgRaw, 'image/svg+xml');
      const svg = doc.documentElement;
      
      // Get all editable elements from the original SVG (same filter as parseSvgElements)
      const allOriginalElements = Array.from(svg.querySelectorAll('*')).filter(el => {
        const tag = el.tagName.toLowerCase();
        const nonEditableTags = ['defs', 'style', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'filter', 'feGaussianBlur', 'feOffset', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode'];
        return !nonEditableTags.includes(tag);
      });
      
      console.log('Found original elements:', allOriginalElements.length);
      
      // Update each element with its edited version
      elements.forEach((editedEl, index) => {
        if (index < allOriginalElements.length) {
          const originalEl = allOriginalElements[index];
          
          console.log(`Updating element ${index}:`, {
            original: {
              tag: originalEl.tagName,
              id: originalEl.getAttribute('id'),
              text: originalEl.textContent
            },
            edited: {
              tag: editedEl.tag,
              id: editedEl.id,
              text: editedEl.innerText,
              attributes: editedEl.attributes
            }
          });
          
          // Update ALL attributes from the edited element
          // First, clear all existing attributes
          while (originalEl.attributes.length > 0) {
            originalEl.removeAttribute(originalEl.attributes[0].name);
          }
          
          // Then set all attributes from the edited element
          Object.entries(editedEl.attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              originalEl.setAttribute(key, value);
              console.log(`  Set attribute: ${key} = "${value}"`);
            }
          });
          
          // Update text content if applicable
          if (typeof editedEl.innerText === 'string') {
            originalEl.textContent = editedEl.innerText;
            console.log(`  Updated text: "${originalEl.textContent}"`);
          }
        }
      });

      const result = svg.outerHTML;
      console.log('SVG regeneration complete');
      return result;
    } catch (error) {
      console.error('Error regenerating SVG:', error);
      return svgRaw;
    }
  }

  function isImageElement(el: SvgElement): boolean {
    return el.tag === 'image' || (typeof el.attributes.href === 'string' && el.attributes.href.startsWith('data:image'));
  }

  function isTextElement(el: SvgElement): boolean {
    return ['text', 'tspan', 'textPath'].includes(el.tag);
  }

  const handleSave = useCallback(() => {
    if (!onSave) return;
    
    console.log('=== SAVE DEBUG ===');
    console.log('Elements to save:', elements);
    console.log('Original SVG length:', svgRaw.length);
    
    // Regenerate SVG and get the updated version immediately
    const updatedSvg = regenerateSvg();
    
    console.log('Updated SVG length:', updatedSvg.length);
    console.log('SVG changed:', updatedSvg !== svgRaw);
    console.log('Updated SVG preview:', updatedSvg.substring(0, 200));
    
    onSave({
      name: name.trim(),
      svg: updatedSvg,
      banner: bannerFile,
      hot: isHot,
      isActive: isActiveState,
      tool: selectedTool && selectedTool !== "" ? selectedTool : undefined,
      tutorialUrl: tutorialUrlState.trim() || undefined,
      tutorialTitle: tutorialTitleState.trim() || undefined
    });
  }, [onSave, name, bannerFile, isHot, isActiveState, selectedTool, tutorialUrlState, tutorialTitleState, elements, svgRaw]);

  // Expose methods and state via ref
  useImperativeHandle(ref, () => ({
    handleSave,
    name
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

      {/* Template Name */}
      <div className="space-y-2">
        <Label htmlFor="template-name" className="text-sm font-medium">
          Template Name
        </Label>
        <Input
          id="template-name"
          placeholder="Enter template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
        />
      </div>

      {/* Tool Selection */}
      <div className="space-y-2">
        <Label htmlFor="tool-select" className="text-sm font-medium">
          Tool
        </Label>
        <Select value={selectedTool || "none"} onValueChange={(value) => setSelectedTool(value === "none" ? "" : value)}>
          <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0">
            <SelectValue placeholder="Select a tool (optional)" />
          </SelectTrigger>
          <SelectContent className="bg-background border border-white/10 ">
            <SelectItem value="none" className="text-white/90 focus:bg-white/5 focus:text-white/80">
              <span className="text-white/60 italic">No tool</span>
            </SelectItem>
            {tools.map((tool) => (
              <SelectItem key={tool.id} value={tool.id} className="text-white/90 hover:bg-white/5 focus:bg-white/5 focus:text-white/80">
                <div className="flex items-center gap-2">
                  <span>{tool.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTool && (
          <div className="text-xs text-white/60">
            Selected: {tools.find(tool => tool.id === selectedTool)?.name}
          </div>
        )}
      </div>

      {/* Tutorial Section */}
      <div className="relative">
        <div 
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
            ${tutorialUrlState.trim() 
              ? 'border-white/50 bg-white/10' 
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200
              ${tutorialUrlState.trim() ? 'bg-white text-black' : 'bg-white/20 text-white/60'}
            `}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Tutorial</h3>
              <p className="text-sm text-white/60">Add a tutorial video to help users</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-4">
            {/* Tutorial URL */}
            <div className="space-y-2">
              <Label htmlFor="tutorial-url" className="text-sm font-medium">
                Tutorial URL
              </Label>
              <Input
                id="tutorial-url"
                placeholder="https://youtube.com/watch?v=..."
                value={tutorialUrlState}
                onChange={(e) => setTutorialUrlState(e.target.value)}
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              />
            </div>

            {/* Tutorial Title */}
            <div className="space-y-2">
              <Label htmlFor="tutorial-title" className="text-sm font-medium">
                Tutorial Title
              </Label>
              <Input
                id="tutorial-title"
                placeholder="How to use the tool"
                value={tutorialTitleState}
                onChange={(e) => setTutorialTitleState(e.target.value)}
                className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hot Template Toggle */}
      <div className="relative">
        <div 
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
            ${isHot 
              ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/20' 
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }
          `}
          onClick={() => setIsHot(!isHot)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                text-2xl transition-all duration-200
                ${isHot ? 'animate-pulse' : 'grayscale opacity-50'}
              `}>
                🔥
              </div>
              <div>
                <div className="font-medium text-sm">
                  Hot Template
                </div>
                <div className="text-xs text-white/60">
                  Featured prominently on homepage
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="hot-template"
                checked={isHot}
                onCheckedChange={(checked) => setIsHot(checked === true)}
                className="pointer-events-none"
              />
            </div>
          </div>
          
          {isHot && (
            <div className="mt-2 pt-2 border-t border-orange-500/20">
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                This template will be featured on the homepage
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Template Toggle */}
      <div className="relative">
        <div 
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
            ${isActiveState 
              ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20' 
              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
            }
          `}
          onClick={() => setIsActiveState(!isActiveState)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                text-2xl transition-all duration-200
                ${isActiveState ? 'animate-pulse' : 'grayscale opacity-50'}
              `}>
                ✓
              </div>
              <div>
                <div className="font-medium text-sm">
                  Published
                </div>
                <div className="text-xs text-white/60">
                  Make this template visible to users in listings
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <Checkbox 
                id="active-template"
                checked={isActiveState}
                onCheckedChange={(checked) => setIsActiveState(checked === true)}
                className="pointer-events-none"
              />
            </div>
          </div>
          
          {!isActiveState && (
            <div className="mt-2 pt-2 border-t border-red-500/20">
              <div className="flex items-center gap-1 text-xs text-red-400">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                This template will be hidden from users
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner Upload */}
      <BannerUpload 
        bannerImage={bannerImage}
        onUpload={handleBannerUpload}
      />

      {/* Element Selection */}
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

      {/* Preview Dialog */}
      <PreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        svgContent={svgRaw}
        formFields={elements.filter(el => el.tag === 'text' && el.attributes['data-field-id']).map(el => ({
          id: el.attributes['data-field-id'] || '',
          name: el.attributes['data-field-name'] || el.attributes['data-field-id'] || '',
          type: el.attributes['data-field-type'] || 'text',
          defaultValue: el.innerText || '',
          currentValue: el.innerText || '',
          required: el.attributes['data-field-required'] === 'true',
          max: el.attributes['data-field-max'] ? parseInt(el.attributes['data-field-max']) : undefined,
          min: el.attributes['data-field-min'] ? parseInt(el.attributes['data-field-min']) : undefined,
          options: el.attributes['data-field-options'] ? JSON.parse(el.attributes['data-field-options']) : undefined,
          helperText: el.attributes['data-helper'] || '',
          editable: el.attributes['data-field-editable'] !== 'false',
        }))}
        templateName={name}
      />
    </div>
  );
});

SvgEditor.displayName = "SvgEditor";

export default SvgEditor;
