import { useState, useCallback, useRef } from "react";
import { parseId, FIELD_TYPES, EXTENSIONS, type ExtensionDefinition } from "../idExtensions";

export function useIdEditor(
  value: string,
  onChange: (value: string) => void
) {
  const [internalValue, setInternalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showValueInput, setShowValueInput] = useState(false);
  const [pendingExtension, setPendingExtension] = useState<ExtensionDefinition | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const applySuggestion = useCallback(
    (extension: ExtensionDefinition) => {
      if (!editorRef.current) return;

      const { baseId: currentBase, parts: currentParts } = parseId(internalValue);
      
      // Check if there's already a dot at the end of the current value
      const hasTrailingDot = internalValue.trim().endsWith(".");
      
      // Get the current partial text being typed (text after last dot)
      const lastDotIndex = internalValue.lastIndexOf(".");
      const currentPartial = lastDotIndex >= 0 
        ? internalValue.substring(lastDotIndex + 1).trim()
        : "";
      
      // Check if user was typing a partial match that should be replaced
      const shouldReplacePartial = !hasTrailingDot && currentPartial && 
        extension.key.toLowerCase().startsWith(currentPartial.toLowerCase());
      
      // If extension/field type requires a value, replace partial text first, then show input dialog
      if (extension.requiresValue) {
        // If user was typing a partial match, replace it first
        if (shouldReplacePartial && currentParts.length > 0) {
          const newParts = [...currentParts];
          // Replace the last part (which is the partial) with the extension key
          newParts[newParts.length - 1] = extension.key;
          const newValue = `${currentBase}.${newParts.join(".")}`;
          setInternalValue(newValue);
          onChange(newValue);
        }
        
        setPendingExtension(extension);
        setShowValueInput(true);
        return;
      }

      // Apply extension/field type without value
      let newValue: string;
      // Check if parts array only contains empty string (user typed "baseId.")
      const isEmptyParts = currentParts.length === 1 && currentParts[0] === "";
      
      if (currentParts.length === 0 || isEmptyParts) {
        // No parts yet or just a trailing dot, add field type
        if (hasTrailingDot || isEmptyParts) {
          // Use existing dot
          newValue = `${currentBase}${extension.key}`;
        } else {
          // Check if base ends with dot
          const baseEndsWithDot = currentBase.endsWith(".");
          newValue = baseEndsWithDot ? `${currentBase}${extension.key}` : `${currentBase}.${extension.key}`;
        }
      } else {
        // Replace last part or add new extension/field type
        const newParts = [...currentParts];
        const lastPart = newParts[newParts.length - 1];
        
        // Check if last part is incomplete (user was typing) or is a partial match
        if (shouldReplacePartial || (lastPart && !FIELD_TYPES.some(ft => ft.key === lastPart) && 
            !EXTENSIONS.some(ext => ext.key === lastPart || lastPart.startsWith(ext.key + "_")))) {
          // Replace incomplete part or partial match
          newParts[newParts.length - 1] = extension.key;
        } else {
          // Add new extension/field type
          newParts.push(extension.key);
        }
        
        newValue = `${currentBase}.${newParts.join(".")}`;
      }

      setInternalValue(newValue);
      onChange(newValue);
      setActiveIndex(0);

      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
    },
    [internalValue, onChange]
  );

  const handleValueInput = useCallback((value: string) => {
    if (!pendingExtension) return;

    const { baseId: currentBase, parts: currentParts } = parseId(internalValue);
    const sanitizedValue = value.trim().replace(/\s+/g, "_");
    
    let newValue: string;
    
    if (currentParts.length === 0) {
      newValue = `${currentBase}.${pendingExtension.key}_${sanitizedValue}`;
    } else {
      const newParts = [...currentParts];
      const lastPart = newParts[newParts.length - 1];
      
      if (lastPart && lastPart.startsWith(pendingExtension.key)) {
        // Replace incomplete extension
        newParts[newParts.length - 1] = `${pendingExtension.key}_${sanitizedValue}`;
      } else {
        // Add new extension with value
        newParts.push(`${pendingExtension.key}_${sanitizedValue}`);
      }
      
      newValue = `${currentBase}.${newParts.join(".")}`;
    }

    setInternalValue(newValue);
    onChange(newValue);
    setShowValueInput(false);
    setPendingExtension(null);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    });
  }, [pendingExtension, internalValue, onChange]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const raw = editorRef.current.innerText || "";
    setInternalValue(raw);
    onChange(raw);
  }, [onChange]);

  return {
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
  };
}

