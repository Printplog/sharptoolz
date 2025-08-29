// components/SvgEditor.tsx
import { useEffect, useState, useRef, useCallback, forwardRef } from "react";
import parseSvgElements, { type SvgElement } from "@/lib/utils/parseSvgElements";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SvgEditorProps {
  svgRaw: string;
  templateName?: string;
  banner?: string;
  onSave?: (data: { name: string; svg: string; banner?: File | null }) => void;
  isLoading?: boolean;
}

// Navigation Component
function ElementNavigation({ 
  elements, 
  onElementClick, 
  selectedElementIndex,
  isTextElement, 
  isImageElement 
}: {
  elements: SvgElement[];
  onElementClick: (index: number) => void;
  selectedElementIndex: number | null;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
}) {
  if (elements.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3 text-white/80">Select Element to Edit</h3>
      <div className="flex flex-wrap gap-2">
        {elements.map((el, index) => {
          const displayName = el.id || `${el.tag} ${index + 1}`;
          const elementType = isTextElement(el) ? '📝' : isImageElement(el) ? '🖼️' : '🔧';
          const isSelected = selectedElementIndex === index;
          return (
            <Button
              key={index}
              onClick={() => onElementClick(index)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={`text-xs h-8 px-2 flex items-center gap-1 ${isSelected ? 'bg-primary text-background' : ''}`}
              title={`${el.tag} element${el.id ? ` (ID: ${el.id})` : ''}`}
            >
              <span>{elementType}</span>
              <span className="truncate max-w-20">{displayName}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Element Editor Component
const ElementEditor = forwardRef<HTMLDivElement, {
  element: SvgElement;
  index: number;
  onUpdate: (index: number, updates: Partial<SvgElement>) => void;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
}>(({ element, index, onUpdate, isTextElement, isImageElement }, ref) => {
  const baseId = element.id?.split(".")[0]?.replace(/_/g, " ") || `${element.tag} ${index + 1}`;

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onUpdate(index, { 
        attributes: { 
          ...element.attributes, 
          href: base64,
          'xlink:href': base64 
        }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={ref}
      className="border p-4 rounded-md bg-white/5 border-white/10 space-y-3"
    >
      <div className="text-sm font-medium text-white/80 capitalize">
        {baseId}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`id-${index}`} className="text-sm font-medium">
          ID
        </Label>
        <Input
          id={`id-${index}`}
          placeholder="Element ID"
          value={element.id || ""}
          onChange={(e) => onUpdate(index, { id: e.target.value })}
          className="input"
        />
      </div>

      {isTextElement(element) && (
        <div className="space-y-2">
          <Label htmlFor={`text-${index}`} className="text-sm font-medium">
            Text Content
          </Label>
          <Textarea
            id={`text-${index}`}
            placeholder="Enter text content"
            value={element.innerText || ""}
            onChange={(e) => onUpdate(index, { innerText: e.target.value })}
            rows={3} 
            className="input"
          />
        </div>
      )}

      {isImageElement(element) && (
        <div className="space-y-2">
          <Label htmlFor={`image-${index}`} className="text-sm font-medium">
            Image (Base64)
          </Label>
          <div className="space-y-2">
            <input
              title="Upload Image"
              id={`image-${index}`}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
            />
            {element.attributes.href && (
              <div className="text-xs text-white/60 break-all">
                Current: {element.attributes.href.substring(0, 50)}...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show other common attributes for non-text, non-image elements */}
      {!isTextElement(element) && !isImageElement(element) && (
        <div className="grid grid-cols-2 gap-2">
          {['fill', 'stroke', 'stroke-width', 'opacity'].map(attr => (
            element.attributes[attr] && (
              <div key={attr} className="space-y-1">
                <Label className="text-xs text-white/60 capitalize">
                  {attr.replace('-', ' ')}
                </Label>
                <Input
                  value={element.attributes[attr] || ""}
                  onChange={(e) => onUpdate(index, { 
                    attributes: { ...element.attributes, [attr]: e.target.value }
                  })}
                  className="text-xs input"
                />
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
});

// Floating Scroll Button Component
function FloatingScrollButton({ show, onClick }: { show: boolean; onClick: () => void }) {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 shadow-lg"
      size="sm"
    >
      ↑
    </Button>
  );
}

export default function SvgEditor({ svgRaw, templateName = "", banner = "", onSave, isLoading }: SvgEditorProps) {
  const [elements, setElements] = useState<SvgElement[]>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [name, setName] = useState<string>(templateName);
  const [bannerImage, setBannerImage] = useState<string>(banner);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  function regenerateSvg(): string {
    try {
      // Get original SVG to preserve defs, styles, etc.
      const parser = new DOMParser();
      const originalDoc = parser.parseFromString(svgRaw, 'image/svg+xml');
      const originalSvg = originalDoc.documentElement;
      
      // Clone the original SVG
      const newSvg = originalSvg.cloneNode(true) as SVGElement;
      
      // Get all elements and filter them the same way as parseSvgElements
      const allElements = Array.from(newSvg.querySelectorAll('*')).filter(el => {
        const tag = el.tagName.toLowerCase();
        const nonEditableTags = ['defs', 'style', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'filter', 'feGaussianBlur', 'feOffset', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode'];
        return !nonEditableTags.includes(tag);
      });
      
      // Update editable elements by index to ensure correct mapping
      elements.forEach((el, index) => {
        if (index < allElements.length) {
          const element = allElements[index];
          
          // Clear all existing attributes first
          while (element.attributes.length > 0) {
            element.removeAttribute(element.attributes[0].name);
          }
          
          // Set all attributes from our edited element
          Object.entries(el.attributes).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              element.setAttribute(key, value);
            }
          });
          
          // Update text content if applicable
          if (typeof el.innerText === 'string') {
            element.textContent = el.innerText;
          }
        }
      });

      return newSvg.outerHTML;
    } catch (error) {
      console.error('Error regenerating SVG:', error);
      // Fallback to original SVG if regeneration fails
      return svgRaw;
    }
  }

  function isImageElement(el: SvgElement): boolean {
    return el.tag === 'image' || (typeof el.attributes.href === 'string' && el.attributes.href.startsWith('data:image'));
  }

  function isTextElement(el: SvgElement): boolean {
    return ['text', 'tspan', 'textPath'].includes(el.tag);
  }

  function handleSave() {
    if (!onSave) return;
    
    // Regenerate SVG and get the updated version immediately
    const updatedSvg = regenerateSvg();
    
    onSave({
      name: name.trim(),
      svg: updatedSvg,
      banner: bannerFile
    });
  }

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <h2 className="text-xl font-semibold">SVG Editor</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={scrollToTop}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            ↑ Top
          </Button>
          {onSave && (
            <Button 
              onClick={handleSave} 
              disabled={!name.trim() || isLoading}
              className="min-w-24"
            >
              {isLoading ? "Saving..." : "Save Template"}
            </Button>
          )}
        </div>
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
          className="max-w-md input"
        />
      </div>

      {/* Banner Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Banner Image
        </Label>
        <div className="relative">
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
          />
          <label
            htmlFor="banner-upload"
            className="block w-full h-48 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors overflow-hidden"
          >
            {bannerImage ? (
              <div className="relative w-full h-full group">
                <div className="w-full h-full overflow-auto custom-scrollbar">
                  <img 
                    src={bannerImage} 
                    alt="Banner preview" 
                    className="w-full max-w-none h-auto object-contain min-h-full"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="text-center text-white">
                    <div className="text-sm font-medium">Click to change banner</div>
                    <div className="text-xs opacity-80">Upload a new image</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
                <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">Click to upload banner</div>
                  <div className="text-xs opacity-80">Upload an image for this template</div>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Element Selection */}
      <ElementNavigation 
        elements={elements}
        onElementClick={handleElementSelect}
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



      {/* Floating Scroll to Top Button */}
      <FloatingScrollButton show={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}