import type {SvgPatch} from '@/types';

/** Keep edits anchored to the base layer even as its extension ID changes. */
export function mergeSvgPatches(patches: SvgPatch[]): SvgPatch[] {
  const aliases = new Map<string, string>();
  const merged = new Map<string, SvgPatch>();
  const reorders: SvgPatch[] = [];
  for (const patch of patches) {
    const id = aliases.get(patch.id) ?? patch.id;
    const normalized = {...patch, id};
    if (patch.attribute === 'id' && typeof patch.value === 'string') {
      aliases.set(patch.value, id);
    }
    if (patch.attribute === 'reorder') reorders.push(normalized);
    else merged.set(JSON.stringify([id, patch.attribute]), normalized);
  }
  return [...merged.values(), ...reorders];
}
