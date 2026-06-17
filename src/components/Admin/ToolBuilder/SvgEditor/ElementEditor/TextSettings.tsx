import { Label } from "@/components/ui/label";
import { DebouncedInput, DebouncedTextarea } from "@/components/ui/debounced-inputs";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface TextSettingsProps {
  localElement: SvgElement;
  handleLocalUpdate: (updates: Partial<SvgElement>) => void;
  isTextElement: (el: SvgElement) => boolean;
}

export const TextSettings = ({
  localElement,
  handleLocalUpdate,
  isTextElement,
}: TextSettingsProps) => {
  if (!isTextElement(localElement)) return null;

  return (
    <div className="space-y-4 border-t border-white/5 pt-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Text Content</Label>
        <DebouncedTextarea
          value={localElement.innerText || ""}
          onChange={(val) => handleLocalUpdate({ innerText: String(val) })}
          rows={6}
          className="bg-white/10 text-sm font-mono border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase font-bold text-white/60">Auto-Wrap Width</Label>
        <DebouncedInput
          type="number"
          value={localElement.attributes["data-max-width"] || ""}
          onChange={(val) =>
            handleLocalUpdate({ attributes: { ...localElement.attributes, "data-max-width": String(val) } })
          }
          className="bg-white/10 h-8 border-white/20 focus-visible:ring-0 focus-visible:border-white/40"
        />
      </div>
    </div>
  );
};
