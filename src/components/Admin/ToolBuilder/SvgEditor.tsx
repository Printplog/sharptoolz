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
  onSave?: (data: { name: string; svg: string }) => void;
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

export default function SvgEditor({ svgRaw, templateName = "", onSave, isLoading }: SvgEditorProps) {
  const [elements, setElements] = useState<SvgElement[]>([]);
  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState<string>(templateName);
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

  // Auto-regenerate preview when elements change
  useEffect(() => {
    if (elements.length > 0 && svgRaw) {
      regenerateSvg();
    }
  }, [elements, svgRaw]);

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

      const updatedSvg = newSvg.outerHTML;
      setPreview(updatedSvg);
      return updatedSvg;
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
      svg: updatedSvg
    });
  }

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

      {/* Element Selection */}
      <ElementNavigation 
        elements={elements}
        onElementClick={handleElementSelect}
        selectedElementIndex={selectedElementIndex}
        isTextElement={isTextElement}
        isImageElement={isImageElement}
      />

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

      <Button onClick={regenerateSvg} variant="outline" className="w-full">
        Generate SVG Preview
      </Button>

      {preview && (
        <div className="mt-6 border p-5 rounded-lg bg-white/10">
          <h3 className="text-lg font-semibold mb-3">Live Preview</h3>
          <div className="bg-white/5 p-4 rounded border-2 border-dashed border-white/20">
            <div
              className="[&_svg]:w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        </div>
      )}

      {/* Floating Scroll to Top Button */}
      <FloatingScrollButton show={showScrollTop} onClick={scrollToTop} />
    </div>
  );
}