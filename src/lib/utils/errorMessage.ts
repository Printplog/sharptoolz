export interface ApiError extends Error {
  code?: string;
  status?: number;
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
}

const GENERIC = "Something went wrong. Please try again.";
const MAX_LENGTH = 240;

const STATUS_MESSAGES: Record<number, string> = {
  400: "That request wasn't valid. Check your details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  408: "The server took too long to respond. Please try again.",
  409: "That conflicts with something that already exists.",
  413: "That file is too large.",
  422: "That request wasn't valid. Check your details and try again.",
  429: "Too many attempts. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again.",
  502: "The server is unreachable right now. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The server took too long to respond. Please try again.",
};

// Envelope keys — their value is the message, so the key itself is never shown.
const ENVELOPE_KEYS = [
  "detail",
  "message",
  "error",
  "errors",
  "non_field_errors",
  "nonFieldErrors",
  "__all__",
];

// Axios/browser noise that should never reach a toast.
const TECHNICAL = [
  /^request failed with status code/i,
  /^network error$/i,
  /^\[object object\]$/i,
  /^undefined$/i,
  /^null$/i,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Django debug pages, nginx 502 bodies and the like — never show these raw. */
const looksLikeMarkup = (text: string) => /^\s*<[!?a-z]/i.test(text);

const clean = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);

const isUsable = (text: string) =>
  text.length > 0 && !looksLikeMarkup(text) && !TECHNICAL.some((pattern) => pattern.test(text));

/** `tracking_id` -> `Tracking id` */
const humanizeKey = (key: string) => {
  const words = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

/**
 * The key is dropped so the toast reads as a plain sentence. The exception is a
 * message that never names its own field ("This field is required.") — on its
 * own that gives the user nothing to act on.
 */
const labelFor = (key: string, message: string) => {
  if (ENVELOPE_KEYS.includes(key) || /^\d+$/.test(key)) return message;
  if (!/^this (field|value)\b/i.test(message)) return message;
  return `${humanizeKey(key)}: ${message}`;
};

function extract(value: unknown, depth = 0): string | null {
  if (depth > 4) return null;

  if (typeof value === "string") {
    const text = clean(value);
    return isUsable(text) ? text : null;
  }

  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extract(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (isRecord(value)) {
    if ("tracking_id" in value) return "Generate a new tracking id";

    // Envelope keys win, so `{detail: "..."}` reads as just the message.
    for (const key of ENVELOPE_KEYS) {
      if (key in value) {
        const found = extract(value[key], depth + 1);
        if (found) return found;
      }
    }

    for (const [key, nested] of Object.entries(value)) {
      const found = extract(nested, depth + 1);
      if (found) return labelFor(key, found);
    }
  }

  return null;
}

export default function errorMessage(error: unknown): string {
  const apiError = (error ?? {}) as ApiError;
  const status = apiError.response?.status ?? apiError.status;

  // No response at all — the request never landed.
  if (!apiError.response) {
    const code = apiError.code ?? "";
    const message = apiError.message ?? "";
    if (code === "ECONNABORTED" || code === "ETIMEDOUT" || /timeout/i.test(message)) {
      return "The request timed out. Please try again.";
    }
    if (code === "ERR_NETWORK" || /network error/i.test(message)) {
      return "Can't reach the server. Check your connection and try again.";
    }
  }

  const extracted = extract(apiError.response?.data);
  if (extracted) return extracted;

  // Body was empty, HTML, or otherwise unusable — fall back to the status.
  if (typeof status === "number") {
    if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
    if (status >= 500) return STATUS_MESSAGES[500];
    if (status >= 400) return STATUS_MESSAGES[400];
  }

  const fallback = clean(apiError.message ?? "");
  return isUsable(fallback) ? fallback : GENERIC;
}
