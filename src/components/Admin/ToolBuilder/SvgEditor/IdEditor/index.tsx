import { useEffect, useCallback } from "react";
import { useSuggestions } from "./useSuggestions";
import { useIdEditor } from "./useIdEditor";
import EditableInput from "./EditableInput";
import SuggestionsDropdown from "./SuggestionsDropdown";
import ValueInputDialog from "./ValueInputDialog";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface IdEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allElements?: SvgElement[];
}

export default function IdEditor({
  value,
  onChange,
  disabled,
  placeholder,
  className,
  allElements = []
}: IdEditorProps) {
  const {
    internalValue,
    setInternalValue,
    isFocused,
    setIsFocused,
    activeIndex,
    setActiveIndex,
    showValueInput,
    setShowValueInput,
    pendingExtension,
    setPendingExtension,
    editorRef,
    applySuggestion,
    handleValueInput,
    handleInput,
  } = useIdEditor(value, onChange);

  const suggestions = useSuggestions(internalValue, isFocused);

  useEffect(() => {
    setInternalValue(value || "");
  }, [value, setInternalValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (showValueInput) {
        // Value input handles its own keyboard events
        return;
      }

      if (!suggestions.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      }

      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const extension = suggestions[activeIndex];
        if (extension) {
          applySuggestion(extension);
        }
      }
    },
    [suggestions, activeIndex, applySuggestion, showValueInput]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, [setIsFocused]);

  const handleBlur = useCallback(() => {
    // Delay to allow clicking on suggestions
    setTimeout(() => setIsFocused(false), 200);
  }, [setIsFocused]);

  const handleCancelValueInput = useCallback(() => {
    setShowValueInput(false);
    setPendingExtension(null);
  }, [setShowValueInput, setPendingExtension]);

  const { baseId, parts } = parseId(internalValue);

  return (
    <div className="relative space-y-3">
      {/* Visual Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[28px] px-1">
        {baseId && (
          <div className="flex items-center">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/20">
              {baseId}
            </span>
            {parts.length > 0 && <span className="text-white/20 mx-0.5 text-xs">.</span>}
          </div>
        )}
        {parts.map((part, i) => (
          <div key={i} className="flex items-center">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${i === 0 ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/5 text-white/50 border-white/10"
              }`}>
              {part}
            </span>
            {i < parts.length - 1 && <span className="text-white/20 mx-0.5 text-xs">.</span>}
          </div>
        ))}
      </div>

      <div className="group relative">
        <EditableInput
          ref={editorRef}
          value={internalValue}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`${className} font-mono text-sm tracking-tight`}
        />

        {/* Keyboard Hint */}
        {isFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] text-white/40">Tab to complete</kbd>
          </div>
        )}
      </div>

      {/* Extension Quick Reference (visible when focused) */}
      {isFocused && !internalValue.includes(".") && (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-1">
          <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest pl-1">Field Types Legend</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              { k: 'text', d: 'Standard input' },
              { k: 'textarea', d: 'Tall text box' },
              { k: 'gen', d: 'Auto-generation' },
              { k: 'sign', d: 'Signature pad' },
              { k: 'upload', d: 'File upload' },
              { k: 'checkbox', d: 'Toggle/Hide' }
            ].map(item => (
              <div key={item.k} className="flex items-center gap-2 group/legend">
                <code className="text-[10px] text-primary/80 bg-primary/5 px-1 rounded transition-colors group-hover/legend:bg-primary/20">.{item.k}</code>
                <span className="text-[10px] text-white/30">{item.d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Value input dialog for extensions that require values */}
      {showValueInput && pendingExtension && (
        <ValueInputDialog
          extension={pendingExtension}
          onApply={handleValueInput}
          onCancel={handleCancelValueInput}
          allElements={allElements}
        />
      )}

      {/* Suggestions dropdown */}
      {isFocused && suggestions.length > 0 && !showValueInput && (
        <SuggestionsDropdown
          suggestions={suggestions}
          activeIndex={activeIndex}
          onSelect={applySuggestion}
          onHover={setActiveIndex}
        />
      )}
    </div>
  );
}

