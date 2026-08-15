import type { ApiTheme } from "@/types";

export const DEFAULT_API_THEME: ApiTheme = {
  primaryColor: "#cee88c",
  backgroundColor: "#10120f",
  textColor: "#ffffff",
  inputBackground: "#191c17",
  borderColor: "#34382f",
  borderRadius: "12px",
  fontFamily: "Inter",
  buttonText: "Create document",
  appearance: "dark",
  showSharpToolzBranding: true,
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
