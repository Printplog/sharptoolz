import { describe, expect, it } from "vitest";

import { correctWebsiteInput, normalizeWebsiteOrigin } from "./normalizeWebsiteOrigin";

describe("normalizeWebsiteOrigin", () => {
  it("corrects a pasted backslash in the visible input immediately", () => {
    expect(correctWebsiteInput(String.raw`https:\app.example.com\dashboard`)).toBe("https://app.example.com/dashboard");
  });

  it("corrects backslashes and keeps only the website origin", () => {
    expect(normalizeWebsiteOrigin(String.raw`https:\app.example.com\dashboard`)).toBe("https://app.example.com");
    expect(normalizeWebsiteOrigin(String.raw`http:\\localhost:3000\form`)).toBe("http://localhost:3000");
  });

  it("adds https when the protocol is omitted", () => {
    expect(normalizeWebsiteOrigin("app.example.com/account?tab=1#profile")).toBe("https://app.example.com");
  });

  it("removes a trailing slash from an exact origin", () => {
    expect(normalizeWebsiteOrigin("https://app.example.com/")).toBe("https://app.example.com");
  });

  it("rejects empty and invalid websites", () => {
    expect(() => normalizeWebsiteOrigin("  ")).toThrow("Enter a website");
    expect(() => normalizeWebsiteOrigin("not a website")).toThrow("Enter a valid website");
  });
});
