import { useState, useCallback, useRef } from 'react';
import {
  type ExtensionDefinition,
  FIELD_TYPES,
  EXTENSIONS,
  parseId
} from '../idExtensions';
import { validateSvgId } from '@/lib/utils/svgIdValidator';

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
    // 1. Run the new DSL validator
    const dslResult = validateSvgId(val);
    if (!dslResult.valid) {
      return { isValid: false, error: dslResult.error };
    }

    const { parts } = parseId(val);

    // 2. Check for duplicate field types (logic from idExtensions)
    const presentFieldTypes = parts.filter(p => FIELD_TYPES.some(ft => ft.key === p || p.startsWith(ft.key + "_")));
    if (presentFieldTypes.length > 1) {
      return {
        isValid: false,
        error: `Only one field type allowed (found: ${presentFieldTypes.join(', ')})`
      };
    }

    // 3. Check for duplicate extensions
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (extension as any).key.toLowerCase().startsWith(currentPartial.toLowerCase());

      // Special handling for Base ID suggestions (which are not extensions yet)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((extension as any).isBaseId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newValue = `${(extension as any).key}.`;
          setInternalValue(newValue);
          setValidation(validate(newValue));
          onChange(newValue);
          return;
      }

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
      const newParts = [...currentParts].filter(p => p !== "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isFieldType = (extension as any).isFieldType;
      
      const existingIndex = newParts.findIndex(p => 
        p === extension.key || p.startsWith(extension.key + "_")
      );

      if (shouldReplacePartial && newParts.length > 0) {
        newParts[newParts.length - 1] = extension.key;
      } else if (existingIndex !== -1) {
        newParts[existingIndex] = extension.key;
      } else if (isFieldType) {
        const firstPartIsFieldType = newParts.length > 0 && FIELD_TYPES.some(ft => 
          newParts[0].startsWith(ft.key + "_") || newParts[0] === ft.key
        );
        if (firstPartIsFieldType) {
          newParts[0] = extension.key;
        } else {
          newParts.unshift(extension.key);
        }
      } else {
        newParts.push(extension.key);
      }

      newValue = `${currentBase}.${newParts.join(".")}`;

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

    const newParts = [...currentParts].filter(p => p !== "");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isFieldType = (pendingExtension as any).isFieldType;

    const existingIndex = newParts.findIndex(p => 
      p === pendingExtension.key || p.startsWith(pendingExtension.key + "_")
    );

    if (existingIndex !== -1) {
      newParts[existingIndex] = `${pendingExtension.key}_${sanitizedValue}`;
    } else if (isFieldType) {
      const firstPartIsFieldType = newParts.length > 0 && FIELD_TYPES.some(ft => 
        newParts[0].startsWith(ft.key + "_") || newParts[0] === ft.key
      );
      if (firstPartIsFieldType) {
        newParts[0] = `${pendingExtension.key}_${sanitizedValue}`;
      } else {
        newParts.unshift(`${pendingExtension.key}_${sanitizedValue}`);
      }
    } else {
      newParts.push(`${pendingExtension.key}_${sanitizedValue}`);
    }

    const newValue = `${currentBase}.${newParts.join(".")}`;

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

