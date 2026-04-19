import { describe, expect, it } from "vitest";
import type { FormField } from "@/types";
import { applyMaskedTestContentToSvg, maskTestTextValue } from "@/lib/utils/svgWatermark";

describe("svgWatermark", () => {
  it("masks alternating characters while preserving separators", () => {
    expect(maskTestTextValue("Michael Oyekola")).toBe("M*c*a*l O*e*o*a");
  });

  it("masks dynamic text fields in test exports without touching static copy", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120">
      <text id="Full_Name">Michael Oyekola</text>
      <text id="Status_Label">APPROVED</text>
    </svg>`;

    const fields: FormField[] = [
      {
        id: "Full_Name",
        name: "Full Name",
        type: "text",
        currentValue: "Michael Oyekola",
        touched: true,
      },
    ];

    const result = applyMaskedTestContentToSvg(svg, fields);

    expect(result).toContain("M*c*a*l O*e*o*a");
    expect(result).toContain("APPROVED");
  });
});
