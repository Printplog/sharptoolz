import { useMemo } from "react";
import { parseId, FIELD_TYPES, EXTENSIONS, type ExtensionDefinition } from "../idExtensions";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

export function useSuggestions(internalValue: string, isFocused: boolean, allElements: SvgElement[] = []) {
  return useMemo(() => {
    if (!isFocused) return [];

    const { baseId: currentBase, parts: currentParts } = parseId(internalValue);

    // Scoring function for fuzzy-ish matching
    const getScore = (key: string, partial: string) => {
      if (!partial) return 1;
      const k = key.toLowerCase();
      const p = partial.toLowerCase();
      if (k === p) return 100;
      if (k.startsWith(p)) return 50;
      if (k.includes(p)) return 10;
      return 0;
    };

    // If no base ID yet, or user is at the start, suggest base IDs from other elements
    if (!currentBase || internalValue.indexOf(".") === -1) {
      const baseIds = new Set<string>();
      allElements.forEach(el => {
        if (el.id) {
          const firstDotIndex = el.id.indexOf(".");
          const bId = firstDotIndex > 0 ? el.id.substring(0, firstDotIndex) : el.id;
          if (bId) baseIds.add(bId);
        }
      });

      const uniqueBaseIds = Array.from(baseIds).sort();
      const partial = internalValue.trim();

      if (!partial) {
        return uniqueBaseIds.map(id => ({ key: id, label: id, helper: "Existing Base ID", isBaseId: true } as any));
      }

      return uniqueBaseIds
        .map(id => ({ item: { key: id, label: id, helper: "Existing Base ID", isBaseId: true } as any, score: getScore(id, partial) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
    }

    const lastDotIndex = internalValue.lastIndexOf(".");
    const hasTrailingDot = internalValue.trim().endsWith(".");
    const currentPartial = hasTrailingDot
      ? ""
      : internalValue.substring(lastDotIndex + 1).trim();

    // Check if we already have a primary field type
    const hasFieldType = FIELD_TYPES.some(ft =>
      currentParts.some(p => p === ft.key)
    );

    if (!hasFieldType) {
      // Still need a field type
      if (!currentPartial) return FIELD_TYPES;

      return FIELD_TYPES
        .map(ft => ({ item: ft, score: getScore(ft.key, currentPartial) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
    }

    // Check if track_ is already present (must be last)
    if (currentParts.some(p => p.startsWith("track_"))) {
      return [];
    }

    // Get allowed extensions
    const fieldType = FIELD_TYPES.find(ft => currentParts.some(p => p === ft.key));
    if (!fieldType) return [];

    const completeParts = currentParts.filter(p => p.length > 0);
    const partsForNext = currentPartial && !hasTrailingDot
      ? completeParts.slice(0, -1)
      : completeParts;

    const isRightAfterFieldTypeOnly = partsForNext.length === 1 &&
      FIELD_TYPES.some(ft => ft.key === partsForNext[0]);

    let actualLastPart: string;
    let actualLastPartBase: string;

    if (partsForNext.length > 0) {
      actualLastPart = partsForNext[partsForNext.length - 1];
      actualLastPartBase = actualLastPart.split("_")[0];
    } else {
      actualLastPart = "";
      actualLastPartBase = "";
    }

    const allowed: ExtensionDefinition[] = [];

    for (const ext of EXTENSIONS) {
      // Check if this extension can come after the last part
      const canComeAfter = (isRightAfterFieldTypeOnly && ext.allowedAfter?.includes(fieldType.key)) ||
        (!isRightAfterFieldTypeOnly && ext.allowedAfter?.includes(actualLastPartBase));

      if (canComeAfter) {
        // Validation: Block duplicate field types if they behave like extensions (e.g., .gen)
        // Or specific rules for extensions
        const alreadyPresent = partsForNext.some(p =>
          p.startsWith(ext.key + "_") || p === ext.key
        );

        if (!alreadyPresent) {
          allowed.push(ext);
        }
      }
    }

    if (!currentPartial) return allowed;

    return allowed
      .map(ext => ({ item: ext, score: getScore(ext.key, currentPartial) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);

  }, [internalValue, isFocused, allElements]);
}

