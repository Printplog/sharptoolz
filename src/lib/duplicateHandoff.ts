/**
 * Hands a document's values to the "Duplicate Document" page.
 *
 * Kept in memory rather than in router state: uploads and signatures are
 * base64 data URLs, and browsers cap the size of history state.
 */
export type DuplicateData = {
  startValues: Record<string, string | number | boolean>;
  startFieldProps: Record<string, { rotation?: number }>;
};

let latest: { id: string; data: DuplicateData } | null = null;

export function storeDuplicate(data: DuplicateData): string {
  const id = `dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  latest = { id, data };
  return id;
}

export function readDuplicate(id: string | undefined): DuplicateData | undefined {
  return id && latest?.id === id ? latest.data : undefined;
}
