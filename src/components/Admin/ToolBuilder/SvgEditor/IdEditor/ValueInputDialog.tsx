import { useRef, useState, useEffect } from "react";
import type { ExtensionDefinition } from "../idExtensions";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface ValueInputDialogProps {
  extension: ExtensionDefinition;
  onApply: (value: string) => void;
  onCancel: () => void;
  allElements?: SvgElement[];
}

export default function ValueInputDialog({ 
  extension, 
  onApply, 
  onCancel,
  allElements = [] 
}: ValueInputDialogProps) {
  const [baseIdSuggestions, setBaseIdSuggestions] = useState<string[]>([]);
  const [showBaseIdSuggestions, setShowBaseIdSuggestions] = useState(false);
  const valueInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // For depends, extract base IDs from all elements
    if (extension.key === "depends" && allElements.length > 0) {
      const baseIds = new Set<string>();
      allElements.forEach(el => {
        if (el.id) {
          const firstDotIndex = el.id.indexOf(".");
          if (firstDotIndex > 0) {
            const baseId = el.id.substring(0, firstDotIndex);
            baseIds.add(baseId);
          }
        }
      });
      setBaseIdSuggestions(Array.from(baseIds).sort());
    }
  }, [extension.key, allElements]);

  const handleApply = () => {
    if (valueInputRef.current) {
      onApply(valueInputRef.current.value);
      setShowBaseIdSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      setShowBaseIdSuggestions(false);
    }
  };

  return (
    <div className="absolute left-0 right-0 z-20 mt-2 rounded-md border border-white/20 bg-black/95 backdrop-blur-sm p-3 shadow-xl">
      <div className="mb-2 text-sm font-semibold text-white">
        {extension.label}
      </div>
      <div className="mb-2 text-xs text-white/60">
        {extension.helper}
      </div>
      <div className="relative">
        <input
          ref={valueInputRef}
          type="text"
          autoFocus
          placeholder={extension.valuePlaceholder || "Enter value"}
          className="w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30"
          onChange={() => {
            // Suggestions will be filtered in the dropdown based on input value
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (extension.key === "depends") {
              setShowBaseIdSuggestions(true);
            }
          }}
        />
        {/* Base ID suggestions for depends */}
        {extension.key === "depends" && showBaseIdSuggestions && baseIdSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto rounded-md border border-white/20 bg-black/90 backdrop-blur-sm shadow-xl custom-scrollbar z-30">
            <div className="px-2 py-1.5 text-xs font-semibold text-white/60 border-b border-white/10">
              Available Base IDs
            </div>
            {baseIdSuggestions
              .filter(baseId => {
                const inputValue = valueInputRef.current?.value.toLowerCase() || "";
                return !inputValue || baseId.toLowerCase().includes(inputValue);
              })
              .map((baseId) => (
                <button
                  key={baseId}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (valueInputRef.current) {
                      valueInputRef.current.value = baseId;
                      handleApply();
                    }
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0 font-mono"
                >
                  {baseId}
                </button>
              ))}
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            onCancel();
            setShowBaseIdSuggestions(false);
          }}
          className="rounded-md bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

