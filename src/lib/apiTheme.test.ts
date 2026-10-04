import { describe, expect, it } from "vitest";

import { readableTextColor } from "./apiTheme";

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
