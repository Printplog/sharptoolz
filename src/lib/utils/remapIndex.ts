/**
 * Where a given position ends up after a list item moves from `from` to `to`.
 *
 * Use it to keep index-keyed state (which row is being edited, per-row draft
 * inputs) attached to the row it belongs to rather than the position that row
 * used to occupy.
 */
export function remapIndex(index: number, from: number, to: number): number {
  if (index === from) return to;
  if (from < to) return index > from && index <= to ? index - 1 : index;
  return index >= to && index < from ? index + 1 : index;
}
