// components/SvgEditor.tsx
import { useEffect, useState } from "react";
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

export default function SvgEditor({ svgRaw, templateName = "", onSave, isLoading }: SvgEditorProps) {
  const [elements, setElements] = useState<SvgElement[]>([]);
  const [preview, setPreview] = useState<string>("");
  const [name, setName] = useState<string>(templateName)

  useEffect(() => {
    const parsed = parseSvgElements(svgRaw);
    // Filter out non-editable elements completely - these should not appear in the editor
    const nonEditableTags = ['defs', 'style', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'filter', 'feGaussianBlur', 'feOffset', 'feFlood', 'feComposite', 'feMerge', 'feMergeNode'];
    const editableElements = parsed.filter(el => !nonEditableTags.includes(el.tag));
    setElements(editableElements);
  }, [svgRaw]);

  useEffect(() => {
    setName(templateName);
  }, [templateName]);

  function updateElement(index: number, updates: Partial<SvgElement>) {
    const updated = [...elements];
    updated[index] = { ...updated[index], ...updates };
    if (updates.id) {
      updated[index].attributes.id = updates.id;
    }
    setElements(updated);
  }

  function regenerateSvg() {
    // Get original SVG to preserve defs, styles, etc.
    const parser = new DOMParser();
    const originalDoc = parser.parseFromString(svgRaw, 'image/svg+xml');
    const originalSvg = originalDoc.documentElement;
    
    // Clone the original SVG
    const newSvg = originalSvg.cloneNode(true) as SVGElement;
    
    // Update editable elements
    elements.forEach((el, index) => {
      const selector = el.id ? `#${el.id}` : `${el.tag}:nth-of-type(${index + 1})`;
      const element = newSvg.querySelector(selector);
      
      if (element) {
        // Update attributes
        Object.entries(el.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
        
        // Update text content if applicable
        if (typeof el.innerText === 'string') {
          element.textContent = el.innerText;
        }
      }
    });

    setPreview(newSvg.outerHTML);
  }

  function isImageElement(el: SvgElement): boolean {
    return el.tag === 'image' || (typeof el.attributes.href === 'string' && el.attributes.href.startsWith('data:image'));
  }

  function isTextElement(el: SvgElement): boolean {
    return ['text', 'tspan', 'textPath'].includes(el.tag);
  }

  function handleImageUpload(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      updateElement(index, { 
        attributes: { 
          ...elements[index].attributes, 
          href: base64,
          'xlink:href': base64 
        }
      });
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!onSave) return;
    
    regenerateSvg();
    onSave({
      name: name.trim(),
      svg: preview || svgRaw
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-5 border-b border-white/10">
        <h2 className="text-xl font-semibold">SVG Editor</h2>
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

      <div className="space-y-2">
        <Label htmlFor="template-name" className="text-sm font-medium">
          Template Name
        </Label>
        <Input
          id="template-name"
          placeholder="Enter template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {elements.map((el, i) => {
          const baseId = el.id?.split(".")[0]?.replace(/_/g, " ") || `${el.tag} ${i + 1}`;
          
          return (
            <div
              key={i}
              className="border p-4 rounded-md bg-white/5 border-white/10 space-y-3"
            >
              <div className="text-sm font-medium text-white/80 capitalize">
                {baseId}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`id-${i}`} className="text-sm font-medium">
                  ID
                </Label>
                <Input
                  id={`id-${i}`}
                  placeholder="Element ID"
                  value={el.id || ""}
                  onChange={(e) => updateElement(i, { id: e.target.value })}
                />
              </div>

              {isTextElement(el) && (
                <div className="space-y-2">
                  <Label htmlFor={`text-${i}`} className="text-sm font-medium">
                    Text Content
                  </Label>
                  <Textarea
                    id={`text-${i}`}
                    placeholder="Enter text content"
                    value={el.innerText || ""}
                    onChange={(e) => updateElement(i, { innerText: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              {isImageElement(el) && (
                <div className="space-y-2">
                  <Label htmlFor={`image-${i}`} className="text-sm font-medium">
                    Image (Base64)
                  </Label>
                  <div className="space-y-2">
                    <input
                      id={`image-${i}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(i, e)}
                      className="block w-full text-sm text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-white/10 file:text-white hover:file:bg-white/20"
                    />
                    {el.attributes.href && (
                      <div className="text-xs text-white/60 break-all">
                        Current: {el.attributes.href.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Show other common attributes for non-text, non-image elements */}
              {!isTextElement(el) && !isImageElement(el) && (
                <div className="grid grid-cols-2 gap-2">
                  {['fill', 'stroke', 'stroke-width', 'opacity'].map(attr => (
                    el.attributes[attr] && (
                      <div key={attr} className="space-y-1">
                        <Label className="text-xs text-white/60 capitalize">
                          {attr.replace('-', ' ')}
                        </Label>
                        <Input
                          value={el.attributes[attr] || ""}
                          onChange={(e) => updateElement(i, { 
                            attributes: { ...el.attributes, [attr]: e.target.value }
                          })}
                          className="text-xs"
                        />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
}