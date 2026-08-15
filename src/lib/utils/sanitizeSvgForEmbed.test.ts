// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { sanitizeSvgForEmbed } from "./sanitizeSvgForEmbed";

describe("sanitizeSvgForEmbed", () => {
  it("removes executable root attributes, scripts, and SVG animation", () => {
    const clean = sanitizeSvgForEmbed(`
      <svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
        <script>alert(2)</script>
        <rect id="safe" width="10" height="10">
          <animate attributeName="href" to="javascript:alert(3)" />
        </rect>
      </svg>
    `);

    expect(clean).not.toMatch(/onload|script|animate|javascript:/i);
    expect(clean).toContain('id="safe"');
  });

  it("removes remote resources while keeping local paint references", () => {
    const clean = sanitizeSvgForEmbed(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="paint"><stop offset="1" /></linearGradient></defs>
        <style>.safe { fill: url(#paint) } .leak { fill: url(https://attacker.example/pixel) }</style>
        <image id="remote" href="https://attacker.example/pixel.png" />
        <image id="nested" href="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+" />
        <rect id="gradient" fill="url(#paint)" />
      </svg>
    `);

    expect(clean).not.toContain("attacker.example");
    expect(clean).not.toContain("image/svg+xml");
    expect(clean).toContain('fill="url(#paint)"');
    expect(clean).not.toContain("<style");
  });

  it("normalizes the legacy raster MIME prefix used by existing templates", () => {
    const clean = sanitizeSvgForEmbed(`
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <image id="legacy" xlink:href="data:img/png;base64,iVBORw0KGgo=" />
      </svg>
    `);

    expect(clean).toContain("data:image/png;base64,iVBORw0KGgo=");
    expect(clean).not.toContain("data:img/png");
  });

  it("rejects malformed non-SVG input", () => {
    expect(() => sanitizeSvgForEmbed("<html></html>")).toThrow("invalid");
  });
});
