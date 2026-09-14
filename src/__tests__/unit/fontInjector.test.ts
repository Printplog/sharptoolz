import { describe, expect, it } from "vitest";
import { injectFontsIntoSVG } from "@/lib/utils/fontInjector";
import type { Font } from "@/types";

const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg">
  <text style="font-family: Inter; font-weight: 700;">Hello</text>
</svg>`;

function makeFont(overrides: Partial<Font>): Font {
  return {
    id: "font-id",
    name: "Inter Regular",
    family: "Inter",
    weight: "400",
    style: "normal",
    font_file: "/fonts/inter-regular.ttf",
    font_url: "/fonts/inter-regular.ttf",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("injectFontsIntoSVG", () => {
  it("keeps same-family font variants separate by weight and style", async () => {
    const result = await injectFontsIntoSVG(
      baseSvg,
      [
        makeFont({ id: "inter-400", name: "Inter Regular", weight: "400", font_url: "/fonts/inter-regular.ttf" }),
        makeFont({ id: "inter-700", name: "Inter Bold", weight: "700", font_url: "/fonts/inter-bold.ttf" }),
        makeFont({ id: "inter-400-italic", name: "Inter Italic", weight: "400", style: "italic", font_url: "/fonts/inter-italic.ttf" }),
      ],
      "https://cdn.test",
      false
    );

    expect(result.match(/font-family: "Inter";/g)).toHaveLength(3);
    expect(result).toContain("font-weight: 400;");
    expect(result).toContain("font-weight: 700;");
    expect(result).toContain("font-style: italic;");
    expect(result).toContain('url("https://cdn.test/fonts/inter-bold.ttf")');
  });

  it("keeps sibling faces separate when they share one family and weight", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <text style="font-family: Arial;">Regular</text>
      <text style="font-family: 'Arial Black';">Black</text>
      <text style="font-family: 'Arial Bold';">Bold</text>
    </svg>`;

    const result = await injectFontsIntoSVG(
      svg,
      [
        makeFont({ id: "arial", name: "Arial", family: "Arial", weight: "normal", font_url: "/fonts/arial.ttf" }),
        makeFont({ id: "arial-black", name: "Arial Black", family: "Arial", weight: "normal", font_url: "/fonts/arial-black.ttf" }),
        makeFont({ id: "arial-bold", name: "Arial Bold", family: "Arial", weight: "normal", font_url: "/fonts/arial-bold.ttf" }),
      ],
      "https://cdn.test",
      true
    );

    expect(result).toContain('font-family: "Arial";');
    expect(result).toContain('font-family: "Arial Black";');
    expect(result).toContain('font-family: "Arial Bold";');
    expect(result).toContain('url("https://cdn.test/fonts/arial.ttf")');
    expect(result).toContain('url("https://cdn.test/fonts/arial-black.ttf")');
    expect(result).toContain('url("https://cdn.test/fonts/arial-bold.ttf")');
  });

  it("does not skip a new same-family variant when one variant already exists", async () => {
    const svgWithRegularFace = `<svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style data-font-injector="true">@font-face {
          font-family: "Inter";
          src: url("/fonts/inter-regular.ttf") format("truetype");
          font-weight: 400;
          font-style: normal;
        }</style>
      </defs>
      <text style="font-family: Inter; font-weight:700;">Hello</text>
    </svg>`;

    const result = await injectFontsIntoSVG(
      svgWithRegularFace,
      [
        makeFont({ id: "inter-400", weight: "400", font_url: "/fonts/inter-regular.ttf" }),
        makeFont({ id: "inter-700", name: "Inter Bold", weight: "700", font_url: "/fonts/inter-bold.ttf" }),
      ],
      "https://cdn.test",
      false
    );

    expect(result.match(/font-weight: 400;/g)).toHaveLength(1);
    expect(result.match(/font-weight: 700;/g)).toHaveLength(1);
  });
});
