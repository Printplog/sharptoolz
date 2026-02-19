import { useState, useCallback, useRef } from 'react';
import {
  type ExtensionDefinition,
  FIELD_TYPES,
  EXTENSIONS,
  parseId
} from '../idExtensions';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function useIdEditor(
  value: string,
  onChange: (value: string) => void
) {
  const [internalValue, setInternalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showValueInput, setShowValueInput] = useState(false);
  const [pendingExtension, setPendingExtension] = useState<ExtensionDefinition | null>(null);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });
  const editorRef = useRef<HTMLDivElement>(null);

  const validate = useCallback((val: string): ValidationResult => {
    const { parts } = parseId(val);

    // Check for duplicate field types
    const presentFieldTypes = parts.filter(p => FIELD_TYPES.some(ft => ft.key === p || p.startsWith(ft.key + "_")));
    if (presentFieldTypes.length > 1) {
      return {
        isValid: false,
        error: `Only one field type allowed (found: ${presentFieldTypes.join(', ')})`
      };
    }

    // Check for duplicate extensions
    const presentExtensions = parts.map(p => p.split('_')[0]).filter(p => EXTENSIONS.some(ext => ext.key === p));
    const duplicates = presentExtensions.filter((item, index) => presentExtensions.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return {
        isValid: false,
        error: `Duplicate extensions: ${duplicates.join(', ')}`
      };
    }

    return { isValid: true };
  }, []);

  const applySuggestion = useCallback(
    (extension: ExtensionDefinition) => {
      if (!editorRef.current) return;

      const { baseId: currentBase, parts: currentParts } = parseId(internalValue);

      const hasTrailingDot = internalValue.trim().endsWith(".");
      const lastDotIndex = internalValue.lastIndexOf(".");
      const currentPartial = lastDotIndex >= 0
        ? internalValue.substring(lastDotIndex + 1).trim()
        : "";

      const shouldReplacePartial = !hasTrailingDot && currentPartial &&
        extension.key.toLowerCase().startsWith(currentPartial.toLowerCase());

      if (extension.requiresValue) {
        if (shouldReplacePartial && currentParts.length > 0) {
          const newParts = [...currentParts];
          newParts[newParts.length - 1] = extension.key;
          const newValue = `${currentBase}.${newParts.join(".")}`;
          setInternalValue(newValue);
          setValidation(validate(newValue));
          onChange(newValue);
        }

        setPendingExtension(extension);
        setShowValueInput(true);
        return;
      }

      let newValue: string;
      const isEmptyParts = currentParts.length === 1 && currentParts[0] === "";

      if (currentParts.length === 0 || isEmptyParts) {
        if (hasTrailingDot || isEmptyParts) {
          newValue = `${currentBase}${extension.key}`;
        } else {
          const baseEndsWithDot = currentBase.endsWith(".");
          newValue = baseEndsWithDot ? `${currentBase}${extension.key}` : `${currentBase}.${extension.key}`;
        }
      } else {
        const newParts = [...currentParts];
        const lastPart = newParts[newParts.length - 1];

        if (shouldReplacePartial || (lastPart && !FIELD_TYPES.some(ft => ft.key === lastPart) &&
          !EXTENSIONS.some(ext => ext.key === lastPart || lastPart.startsWith(ext.key + "_")))) {
          newParts[newParts.length - 1] = extension.key;
        } else {
          newParts.push(extension.key);
        }

        newValue = `${currentBase}.${newParts.join(".")}`;
      }

      setInternalValue(newValue);
      setValidation(validate(newValue));
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
    [internalValue, onChange, validate]
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
        newParts[newParts.length - 1] = `${pendingExtension.key}_${sanitizedValue}`;
      } else {
        newParts.push(`${pendingExtension.key}_${sanitizedValue}`);
      }

      newValue = `${currentBase}.${newParts.join(".")}`;
    }

    setInternalValue(newValue);
    setValidation(validate(newValue));
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
  }, [pendingExtension, internalValue, onChange, validate]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const raw = editorRef.current.innerText || "";
    setInternalValue(raw);
    setValidation(validate(raw));
    onChange(raw);
  }, [onChange, validate]);

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
    validation,
    editorRef,
    applySuggestion,
    handleValueInput,
    handleInput,
  };
}

