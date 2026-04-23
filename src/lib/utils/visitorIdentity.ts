const VISITOR_ID_STORAGE_KEY = "sharptoolz_visitor_id";

function generateVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readStoredVisitorId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredVisitorId(visitorId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
  } catch {
    // Ignore storage failures and keep the current page working.
  }
}

export function ensureVisitorId() {
  const existingVisitorId = readStoredVisitorId();
  if (existingVisitorId) {
    return existingVisitorId;
  }

  const visitorId = generateVisitorId();
  writeStoredVisitorId(visitorId);
  return visitorId;
}
