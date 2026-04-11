import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ClarificationOption } from "@/store/chatStore";

/** Parse a CSS style string into a React style object. E.g. "color: red; font-size: 12px;" → { color: "red", fontSize: "12px" } */
function parseCustomStyle(styleStr: string): React.CSSProperties {
  const style: Record<string, string> = {};
  styleStr.split(";").forEach((decl) => {
    const [prop, ...rest] = decl.split(":");
    if (prop && rest.length) {
      const key = prop.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      style[key] = rest.join(":").trim();
    }
  });
  return style as React.CSSProperties;
}

interface ClarificationPromptProps {
  question: string;
  options: ClarificationOption[];
  onSelect: (option: ClarificationOption) => void;
  onCustom?: (value: string) => void;
}

export default function ClarificationPrompt({
  question,
  options,
  onSelect,
  onCustom,
}: ClarificationPromptProps) {
  const [customValue, setCustomValue] = useState("");
  const [hasSelected, setHasSelected] = useState<string | null>(null);

  const handleSelect = (option: ClarificationOption) => {
    setHasSelected(option.label);
    onSelect(option);
  };

  const handleCustomSend = () => {
    const trimmed = customValue.trim();
    if (!trimmed || !onCustom) return;
    setHasSelected(trimmed);
    onCustom(trimmed);
    setCustomValue("");
  };

  return (
    <div className="w-full mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] px-3.5 py-3">
        {/* Question */}
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles size={13} className="text-indigo-400 shrink-0" />
          <p className="text-[12px] font-medium text-indigo-200">{question}</p>
        </div>

        {/* Option chips */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const isSelected = hasSelected === option.label;
            return (
              <button
                key={option.label}
                disabled={!!hasSelected}
                onClick={() => handleSelect(option)}
                style={
                  option.style
                    ? { ...parseCustomStyle(option.style) }
                    : undefined
                }
                className={`
                  group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium
                  transition-all duration-200 border
                  ${
                    !option.style
                      ? isSelected
                        ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-200"
                        : "bg-white/[0.04] border-white/10 text-white/70 hover:bg-white/[0.08] hover:border-white/20 hover:text-white"
                      : ""
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <span>{option.label}</span>
                <ArrowRight
                  size={10}
                  className={`transition-all ${
                    isSelected
                      ? "text-indigo-300"
                      : "text-white/20 group-hover:text-white/50 group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        {onCustom && !hasSelected && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <input
              type="text"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customValue.trim()) {
                  e.preventDefault();
                  handleCustomSend();
                }
              }}
              placeholder="Or type your own..."
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.06] transition-colors"
            />
            <button
              onClick={handleCustomSend}
              disabled={!customValue.trim()}
              className="shrink-0 p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ArrowRight size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
