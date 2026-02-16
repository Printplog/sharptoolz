import { useEffect, useCallback } from "react";
import { useSuggestions } from "./useSuggestions";
import { useIdEditor } from "./useIdEditor";
import EditableInput from "./EditableInput";
import SuggestionsDropdown from "./SuggestionsDropdown";
import ValueInputDialog from "./ValueInputDialog";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { parseId } from "../idExtensions";

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

  return (
    <div className="relative">
      <EditableInput
        ref={editorRef}
        value={internalValue}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />

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

