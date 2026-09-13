import { useState, useCallback } from 'react';
import type { SvgPatch } from '@/types';
import {mergeSvgPatches} from '@/lib/utils/mergeSvgPatches';

/**
 * Custom hook to manage a list of SVG patch updates.
 * This provides a structured way to track changes to an SVG
 * without holding the entire SVG string in state.
 */
export function useSvgPatch() {
  const [patches, setPatches] = useState<SvgPatch[]>([]);

  /**
   * Adds a new change to the patch list.
   * To keep the patch list efficient, it replaces any previous changes
   * for the same element and attribute with the new value.
   */
  const addPatch = useCallback((newPatch: SvgPatch) => {
    setPatches(prevPatches => mergeSvgPatches([...prevPatches, newPatch]));
  }, []);

  /**
   * Clears all patches from the list.
   * This should be called after the patches have been successfully saved.
   */
  const clearPatch = useCallback(() => {
    setPatches([]);
  }, []);

  /**
   * Bulk updates the patches from an external source (e.g. import)
   */
  const setPatchesRaw = useCallback((newPatches: SvgPatch[]) => {
    setPatches(newPatches);
  }, []);

  return {
    patches,
    addPatch,
    clearPatch,
    setPatches: setPatchesRaw
  };
}
