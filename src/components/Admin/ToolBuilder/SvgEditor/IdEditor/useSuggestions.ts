import { useMemo } from "react";
import { parseId, FIELD_TYPES, EXTENSIONS, type ExtensionDefinition } from "../idExtensions";

export function useSuggestions(internalValue: string, isFocused: boolean) {
  return useMemo(() => {
    if (!isFocused) return [];

    const { baseId: currentBase, parts: currentParts } = parseId(internalValue);
    
    // If no base ID yet, no suggestions
    if (!currentBase) {
      return [];
    }

    // If no "." yet, user is still typing base ID - no suggestions
    if (internalValue.indexOf(".") === -1) {
      return [];
    }

    // Check if there's a trailing dot (user just typed a dot)
    const hasTrailingDot = internalValue.trim().endsWith(".");
    
    // Get the current partial text being typed after the last dot
    // Extract text after the last dot (this is what user is currently typing)
    const lastDotIndex = internalValue.lastIndexOf(".");
    const currentPartial = hasTrailingDot 
      ? "" 
      : internalValue.substring(lastDotIndex + 1).trim();
    
    // Check if we have a field type (complete, not partial)
    const hasFieldType = FIELD_TYPES.some(ft => 
      currentParts.some(p => p === ft.key)
    );

    if (!hasFieldType) {
      // Still need a field type - suggest field types, filtered by what user is typing
      if (!currentPartial) {
        return FIELD_TYPES; // Show all if just typed dot
      }
      // Filter by partial match (like VS Code)
      return FIELD_TYPES.filter(ft => 
        ft.key.toLowerCase().startsWith(currentPartial.toLowerCase())
      );
    }

    // Check if track_ is already present (must be last)
    if (currentParts.some(p => p.startsWith("track_"))) {
      return []; // Nothing can come after track_
    }

    // Get allowed extensions
    const allowed: ExtensionDefinition[] = [];
    
    // Find the field type
    const fieldType = FIELD_TYPES.find(ft => currentParts.some(p => p === ft.key));
    
    if (!fieldType) {
      return [];
    }

    // Filter out empty parts (from trailing dots)
    const completeParts = currentParts.filter(p => p.length > 0);
    
    // If user is typing a partial, exclude it from completeParts when determining what comes next
    // This helps us identify what the last COMPLETE part is (before the partial being typed)
    const partsForNext = currentPartial && !hasTrailingDot
      ? completeParts.slice(0, -1) // Remove the partial we're currently typing
      : completeParts;
    
    // Check if we're right after field type only (exactly 1 complete part which is a field type)
    // This includes both ".text" and ".text." (trailing dot) cases, and ".text.m" (typing partial)
    const isRightAfterFieldTypeOnly = partsForNext.length === 1 && 
      FIELD_TYPES.some(ft => ft.key === partsForNext[0]);
    
    // Check if we have any extensions (anything that's not a field type) in the complete parts
    const hasAnyExtension = partsForNext.some(p => {
      const partBase = p.split("_")[0];
      return !FIELD_TYPES.some(ft => ft.key === partBase);
    });
    
    // Determine what the last COMPLETE part is (for trailing dot or partial typing)
    // When user is typing a partial (e.g., "baseId.text.m"), we need to look at the part BEFORE the partial
    // When there's a trailing dot, the last complete part is what we just finished typing
    let actualLastPart: string;
    let actualLastPartBase: string;
    
    // Use partsForNext to get the last complete part (excludes any partial being typed)
    if (partsForNext.length > 0) {
      actualLastPart = partsForNext[partsForNext.length - 1];
      actualLastPartBase = actualLastPart.split("_")[0];
    } else {
      // Fallback: shouldn't happen if we have a field type
      actualLastPart = "";
      actualLastPartBase = "";
    }
    
    // If we're right after field type only (no extensions), show extensions that can come after it
    // This works for both ".text" and ".text." (trailing dot triggers suggestions)
    if (isRightAfterFieldTypeOnly && !hasAnyExtension) {
      for (const ext of EXTENSIONS) {
        if (ext.allowedAfter?.includes(fieldType.key)) {
          const alreadyPresent = partsForNext.some(p => 
            p.startsWith(ext.key + "_") || p === ext.key
          );
          
          if (!alreadyPresent) {
            // Filter by current partial text (like VS Code)
            if (!currentPartial || ext.key.toLowerCase().startsWith(currentPartial.toLowerCase())) {
              allowed.push(ext);
            }
          }
        }
      }
    } else {
      // We have extensions OR trailing dot after extension - show extensions that can come after
      // When there's a trailing dot, actualLastPart is the last complete part we just finished
      for (const ext of EXTENSIONS) {
        // Check if this extension can come after the actual last complete part
        const canComeAfter = ext.allowedAfter?.includes(actualLastPartBase);
        
        if (canComeAfter) {
          const alreadyPresent = partsForNext.some(p => 
            p.startsWith(ext.key + "_") || p === ext.key
          );
          
          if (!alreadyPresent) {
            // Filter by current partial text (like VS Code)
            // Show all if trailing dot (currentPartial is empty), or filter if typing
            if (!currentPartial || ext.key.toLowerCase().startsWith(currentPartial.toLowerCase())) {
              allowed.push(ext);
            }
          }
        }
      }
    }

    return allowed;
  }, [internalValue, isFocused]);
}

