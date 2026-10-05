import type { ApiTheme } from "@/types";

export const DEFAULT_API_THEME: ApiTheme = {
  primaryColor: "#cee88c",
  backgroundColor: "#0f1620",
  textColor: "#ffffff",
  inputBackground: "#1b222b",
  borderColor: "#272d36",
  borderRadius: "12px",
  fontFamily: "Inter",
  buttonText: "Create document",
  appearance: "dark",
  showSharpToolzBranding: false,
};

export type ApiThemeColorKey = keyof Pick<
  ApiTheme,
  "primaryColor" | "backgroundColor" | "textColor" | "inputBackground" | "borderColor"
>;

export const API_THEME_COLORS: Array<{ key: ApiThemeColorKey; label: string }> = [
  { key: "primaryColor", label: "Accent" },
  { key: "backgroundColor", label: "Background" },
  { key: "textColor", label: "Text" },
  { key: "inputBackground", label: "Inputs" },
  { key: "borderColor", label: "Borders" },
];

export function readableTextColor(backgroundColor: string) {
  const hex = backgroundColor.trim().replace(/^#/, "");
  const normalized = hex.length === 3
    ? hex.split("").map((character) => character + character).join("")
    : hex;

  if (!/^[0-9a-f]{6}$/i.test(normalized)) return "#09090b";

  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);

  return luminance > 0.179 ? "#09090b" : "#ffffff";
}
