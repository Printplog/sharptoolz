import { describe, expect, it } from "vitest";

import { ALL_COUNTRIES, countryName, flagUrl, matchesCountry } from "./countries";

describe("countries", () => {
  it("lists every country once, sorted by name", () => {
    expect(ALL_COUNTRIES.length).toBeGreaterThan(240);
    expect(new Set(ALL_COUNTRIES.map((c) => c.code)).size).toBe(ALL_COUNTRIES.length);
    const names = ALL_COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("names countries in English", () => {
    expect(countryName("NG")).toBe("Nigeria");
    expect(countryName("us")).toBe("United States");
    expect(countryName("XK")).toBe("Kosovo");
  });

  it("finds countries by name, code or common short name", () => {
    const find = (search: string) => ALL_COUNTRIES.filter((c) => matchesCountry(c, search)).map((c) => c.code);
    expect(find("niger")).toEqual(expect.arrayContaining(["NE", "NG"]));
    expect(find("usa")).toContain("US");
    expect(find("uk")).toContain("GB");
    expect(find("gb")).toEqual(["GB"]);
  });

  it("builds flag image urls", () => {
    expect(flagUrl("NG")).toBe("https://flagcdn.com/w40/ng.png");
    expect(flagUrl("us", 80)).toBe("https://flagcdn.com/w80/us.png");
  });
});
