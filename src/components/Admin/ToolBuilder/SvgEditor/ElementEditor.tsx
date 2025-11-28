// ElementEditor component for editing individual SVG elements
import { forwardRef, useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import IdEditor from "./IdEditor/index";
import GenRuleBuilder from "./IdEditor/GenRuleBuilder";

interface ElementEditorProps {
  element: SvgElement;
  index: number;
  onUpdate: (index: number, updates: Partial<SvgElement>) => void;
  isTextElement: (el: SvgElement) => boolean;
  isImageElement: (el: SvgElement) => boolean;
  allElements?: SvgElement[]; // All elements to extract base IDs for depends suggestions
}

const ElementEditor = forwardRef<HTMLDivElement, ElementEditorProps>(
  ({ element, index, onUpdate, isTextElement, isImageElement, allElements = [] }, ref) => {
    const [showGenBuilder, setShowGenBuilder] = useState(false);

    // --- Normalize legacy / duplicated .gen.gen_ patterns once on load ---
    useEffect(() => {
      const id = element.id || "";
      const parts = id.split(".");

      // If we have "... .gen .gen_XXX ..." collapse to "... .gen_XXX ..."
      if (parts.length >= 3 && parts[1] === "gen" && parts[2].startsWith("gen_")) {
        const normalizedParts = [parts[0], ...parts.slice(2)];
        const normalizedId = normalizedParts.join(".");

        if (normalizedId !== id) {
          onUpdate(index, { id: normalizedId });
        }
      }
    }, [element.id, index, onUpdate]);

    const baseId = element.id?.split(".")[0]?.replace(/_/g, " ") || `${element.tag} ${index + 1}`;
    
    // Check if this is a gen field
    const isGenField = element.id?.includes(".gen");
    const genRuleMatch = element.id?.match(/gen_(.+?)(?:\.|$)/);
    const currentGenRule = genRuleMatch ? genRuleMatch[1] : "";
    const maxLengthMatch = element.id?.match(/max_(\d+)/);
    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : undefined;
    
    const handleGenRuleChange = (newRule: string) => {
      // Only touch the gen_ part of the ID, leave all other extensions (like max_) intact
      const parts = element.id?.split(".") || [];
      let replaced = false;

      const newParts = parts.map((p) => {
        if (p.startsWith("gen_")) {
          replaced = true;
          return `gen_${newRule}`;
        }
        return p;
      });

      // If there was no existing gen_ rule, append it as a new extension
      if (!replaced) {
        newParts.push(`gen_${newRule}`);
      }

      onUpdate(index, { id: newParts.join(".") });
    };

    // Extract current field values from allElements for preview
    const currentFieldValues = useMemo(() => {
      const values: Record<string, string> = {};
      allElements.forEach(el => {
        if (el.id) {
          const firstDotIndex = el.id.indexOf(".");
          if (firstDotIndex > 0) {
            const baseId = el.id.substring(0, firstDotIndex);
            // Get current text content from the element
            const currentValue = el.innerText || '';
            if (currentValue) {
              values[baseId] = currentValue;
            }
          }
        }
      });
      return values;
    }, [allElements]);

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
          <Label className="text-sm font-medium">
            ID
          </Label>
          <IdEditor
            value={element.id || ""}
            onChange={(newId) => onUpdate(index, { id: newId })}
            placeholder="Start typing base ID (e.g. tracking_id)"
            allElements={allElements}
          />
        </div>

        {/* Generation Rule Builder - For gen fields */}
        {isGenField && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white/80">
              Generation Rule
            </Label>
            <GenRuleBuilder
              value={currentGenRule}
              onChange={handleGenRuleChange}
              allElements={allElements}
              maxLength={maxLength}
              open={showGenBuilder}
              onOpenChange={setShowGenBuilder}
              currentFieldValues={currentFieldValues}
              trigger={
                <Input
                  value={currentGenRule}
                  readOnly
                  placeholder="No generation rule set - click to build"
                  className="bg-white/5 border-white/20 text-white/60 cursor-pointer"
                />
              }
            />
          </div>
        )}

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
