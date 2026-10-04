import { describe, expect, it } from "vitest";

import { DEFAULT_API_THEME, readableTextColor } from "./apiTheme";

describe("DEFAULT_API_THEME", () => {
  it("uses the SharpToolz brand palette", () => {
    expect(DEFAULT_API_THEME).toMatchObject({
      primaryColor: "#cee88c",
      backgroundColor: "#0f1620",
      textColor: "#ffffff",
      inputBackground: "#1b222b",
      borderColor: "#272d36",
      appearance: "dark",
    });
  });
});

describe("readableTextColor", () => {
  it("uses dark text on light brand colors", () => {
    expect(readableTextColor("#cee88c")).toBe("#09090b");
    expect(readableTextColor("#fff")).toBe("#09090b");
  });

  it("uses white text on dark brand colors", () => {
    expect(readableTextColor("#17324d")).toBe("#ffffff");
    expect(readableTextColor("#000")).toBe("#ffffff");
  });

  it("falls back safely for an unexpected value", () => {
    expect(readableTextColor("not-a-color")).toBe("#09090b");
  });
});
