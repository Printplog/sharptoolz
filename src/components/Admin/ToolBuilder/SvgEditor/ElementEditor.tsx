// ElementEditor component for editing individual SVG elements
import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface ElementEditorProps {
  element: SvgElement;
  index: number;
  onUpdate: (index: number, updates: Partial<SvgElement>) => void;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
}

const ElementEditor = forwardRef<HTMLDivElement, ElementEditorProps>(
  ({ element, index, onUpdate, isTextElement, isImageElement }, ref) => {
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
            className="bg-white/10 border-white/20"
          />
        </div>

        {/* Helper Text - Available for all elements */}
        <div className="space-y-2">
          <Label htmlFor={`helper-${index}`} className="text-sm font-medium text-white/80">
            Helper Text
            <span className="text-xs text-white/50 ml-2">(Optional - shows info icon for users)</span>
          </Label>
          <Textarea
            id={`helper-${index}`}
            placeholder="Add helpful instructions for this field..."
            value={element.attributes['data-helper'] || ""}
            onChange={(e) => onUpdate(index, { 
              attributes: { ...element.attributes, 'data-helper': e.target.value }
            })}
            rows={2}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-sm"
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
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 text-xs"
                  />
                </div>
              )
            ))}
          </div>
        )}
      </div>
    );
  }
);

ElementEditor.displayName = "ElementEditor";

export default ElementEditor;
