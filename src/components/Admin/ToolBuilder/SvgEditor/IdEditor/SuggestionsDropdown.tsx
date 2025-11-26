import { cn } from "@/lib/utils";
import type { ExtensionDefinition } from "../idExtensions";

interface SuggestionsDropdownProps {
  suggestions: ExtensionDefinition[];
  activeIndex: number;
  onSelect: (extension: ExtensionDefinition) => void;
  onHover: (index: number) => void;
}

export default function SuggestionsDropdown({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: SuggestionsDropdownProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 z-10 mt-2 max-h-64 overflow-auto rounded-md border border-white/20 bg-black/90 backdrop-blur-sm shadow-xl custom-scrollbar">
      {suggestions.map((extension, idx) => (
        <button
          key={`${extension.key}-${idx}`}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(extension);
          }}
          onMouseEnter={() => onHover(idx)}
          className={cn(
            "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
            idx === activeIndex ? "bg-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              .{extension.key}
              {extension.requiresValue && (
                <span className="ml-1 text-xs text-white/50">_value</span>
              )}
            </div>
            <div className="text-xs text-white/60 mt-0.5">{extension.helper}</div>
          </div>
          <div className="text-[10px] uppercase tracking-wide text-white/40">
            {extension.mustBeLast ? "Last" : "Extension"}
          </div>
        </button>
      ))}
    </div>
  );
}

