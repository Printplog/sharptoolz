import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import { resolveApiBaseUrl } from "@/api/resolveApiBaseUrl";
import type { SiteSettings } from "@/types";

const DEFAULT_PRODUCTION_FERNWAY_URL = "https://fernway.sharptoolz.com";

function getFallbackFernwayUrl(): string {
  const configured = (import.meta.env.VITE_FERNWAY_APP_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return DEFAULT_PRODUCTION_FERNWAY_URL;
    }
  }
  return "http://localhost:4729";
}

export function normalizeFernwayBaseUrl(raw?: string | null): string {
  const trimmed = (raw || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return trimmed;
}

export function getFernwayAppBaseUrl(overrideUrl?: string | null): string {
  const preferred = normalizeFernwayBaseUrl(overrideUrl) || getFallbackFernwayUrl();
  return resolveApiBaseUrl(
    preferred,
    typeof window !== "undefined" ? window.location.href : undefined,
  ).replace(/\/+$/, "");
}

export function useFernwayAppBaseUrl(overrideUrl?: string | null): string {
  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
    staleTime: 60 * 1000,
  });
  return getFernwayAppBaseUrl(overrideUrl || siteSettings?.online_banking_url);
}

export interface FernwayThemeOption {
  id: string;
  label: string;
  tagline: string;
  primary: string;
  brand: string;
  accent: string;
  gradient: string;
  previewColors: [string, string, string];
}

export const FERNWAY_GREEN_THEME: FernwayThemeOption = {
  id: "emerald-forest",
  label: "Fernway Green",
  tagline: "Unified private banking emerald and forest green",
  primary: "#059669",
  brand: "#065f46",
  accent: "#34d399",
  gradient: "linear-gradient(135deg, #10b981 0%, #047857 52%, #022c22 100%)",
  previewColors: ["#059669", "#065f46", "#34d399"],
};

export const FERNWAY_THEMES: FernwayThemeOption[] = [FERNWAY_GREEN_THEME];

export interface FernwayFormState {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  transaction_pin: string;
  theme: string;
  account_balance: string;
  card_holder_name: string;
  card_number: string;
  card_expiry: string;
  card_cvv: string;
  card_pin: string;
  card_limit: string;
  card_is_frozen: boolean;
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatCardExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function generateCardNumber(): string {
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  const tail = Array.from(bytes, (b) => String(b % 10)).join("");
  return formatCardNumber(`4532${tail}`);
}

export function generateCvv(): string {
  const bytes = new Uint32Array(3);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

export function generateTransactionPin(): string {
  const bytes = new Uint32Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join("");
}

export function getFernwayTheme(themeId?: string): FernwayThemeOption {
  void themeId;
  return FERNWAY_GREEN_THEME;
}

export function normalizeDollarString(value: string, fallback = "0.00"): string {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed.toFixed(2);
}

export function formatUsd(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value || "0"));
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
