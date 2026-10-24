import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  onCode: (code: string) => void;
  length?: number;
};

const POLL_MS = 1500;

/** "123456" or "123 456" (how authenticator apps show it) -> "123456"; anything else -> null. */
export function otpFromClipboardText(text: string, length = 6): string | null {
  const trimmed = text.trim();
  if (!new RegExp(`^[\\d\\s-]{${length},${length + 2}}$`).test(trimmed)) return null;
  const digits = trimmed.replace(/[\s-]/g, "");
  return digits.length === length ? digits : null;
}

async function clipboardReadState(): Promise<PermissionState | null> {
  try {
    const status = await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
    return status.state;
  } catch {
    // Firefox/Safari don't expose this permission and show a "Paste" bubble on
    // every read instead, so we leave those to a normal paste
    return null;
  }
}

/**
 * Picks up a one-time code that's already on the clipboard when the page is
 * opened or brought back into focus, so the user doesn't have to paste it.
 * Each code is only tried once, so a stale or wrong code isn't resubmitted.
 */
export function useClipboardOtp({ enabled, onCode, length = 6 }: Options) {
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const triedRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !window.isSecureContext || !navigator.clipboard?.readText) return;
    let cancelled = false;
    let reading = false;
    let timer: number | undefined;

    const check = async () => {
      if (cancelled || reading || !document.hasFocus()) return;
      reading = true;
      try {
        const state = await clipboardReadState();
        if (!state || state === "denied") return;
        // Once reads are allowed they're silent, so keep watching for a newly copied code
        if (state === "granted" && timer === undefined) timer = window.setInterval(check, POLL_MS);
        const code = otpFromClipboardText(await navigator.clipboard.readText(), length);
        if (cancelled || !code || triedRef.current.has(code)) return;
        triedRef.current.add(code);
        onCodeRef.current(code);
      } catch {
        // Permission refused or clipboard busy; typing/pasting still works
      } finally {
        reading = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    void check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, length]);
}
