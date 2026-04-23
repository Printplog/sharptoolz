import type { TrafficAttribution } from "@/types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();

function hasMeasurementId() {
  return Boolean(measurementId);
}

function ensureGtag() {
  if (typeof window === "undefined") return null;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

  return window.gtag;
}

export function initGoogleAnalytics() {
  if (!hasMeasurementId() || typeof document === "undefined") {
    return;
  }

  if (!document.querySelector(`script[data-ga-measurement-id="${measurementId}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.gaMeasurementId = measurementId || "";
    document.head.appendChild(script);
  }

  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("js", new Date());
  gtag("config", measurementId, { send_page_view: false });
}

export function trackPageView(path: string, attribution?: TrafficAttribution) {
  if (!hasMeasurementId() || typeof window === "undefined") {
    return;
  }

  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("event", "page_view", {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
    source: attribution?.source,
    medium: attribution?.medium,
    campaign: attribution?.campaign,
  });
}

export function trackSignUp(attribution?: TrafficAttribution) {
  if (!hasMeasurementId()) {
    return;
  }

  const gtag = ensureGtag();
  if (!gtag) return;

  gtag("event", "sign_up", {
    method: "credentials",
    source: attribution?.source,
    medium: attribution?.medium,
    campaign: attribution?.campaign,
  });
}
