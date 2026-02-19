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
    validation,
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
    [suggestions, activeIndex, applySuggestion, showValueInput, setActiveIndex]
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

  return (
    <div className="relative space-y-2">
      <EditableInput
        ref={editorRef}
        value={internalValue}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        hasError={!validation.isValid}
        placeholder={placeholder}
        className={className}
      />

      {!validation.isValid && validation.error && (
        <div className="text-[10px] text-red-400 font-medium px-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="w-1 h-1 rounded-full bg-red-400" />
          {validation.error}
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

