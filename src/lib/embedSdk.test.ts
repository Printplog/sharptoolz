// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SharpToolzSdk = {
  mount: (target: HTMLElement, options: {
    embedUrl: string;
    onComplete?: (result: { documentId: string; sessionId: string }) => void;
  }) => { iframe: HTMLIFrameElement; destroy: () => void };
};

const sdkSource = readFileSync(resolve(process.cwd(), "public/embed/v1.js"), "utf8");
const validToken = `stz_embed_${"a".repeat(43)}`;

function loadSdk() {
  new Function("window", sdkSource)(window);
  return (window as typeof window & { SharpToolz: SharpToolzSdk }).SharpToolz;
}

describe("hosted embed SDK", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it("accepts only a SharpToolz hosted URL with a correctly shaped token", () => {
    const sdk = loadSdk();
    const target = document.createElement("div");
    document.body.append(target);

    expect(() => sdk.mount(target, {
      embedUrl: `https://evil-sharptoolz.com/embed#${validToken}`,
    })).toThrow("not a SharpToolz");
    expect(() => sdk.mount(target, {
      embedUrl: `https://sharptoolz.com:444/embed#${validToken}`,
    })).toThrow("not a SharpToolz");
    expect(() => sdk.mount(target, {
      embedUrl: "https://sharptoolz.com/embed#stz_embed_short",
    })).toThrow("not a SharpToolz");
  });

  it("sandboxes the iframe and ignores forged cross-window messages", () => {
    const sdk = loadSdk();
    const target = document.createElement("div");
    document.body.append(target);
    const onComplete = vi.fn();
    const controller = sdk.mount(target, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      onComplete,
    });

    expect(controller.iframe.getAttribute("sandbox")).toBe("allow-scripts allow-forms allow-same-origin");
    expect(controller.iframe.referrerPolicy).toBe("strict-origin");

    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://attacker.example",
      source: controller.iframe.contentWindow,
      data: { type: "sharptoolz:completed", documentId: "forged", sessionId: "forged" },
    }));
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://sharptoolz.com",
      source: window,
      data: { type: "sharptoolz:completed", documentId: "forged", sessionId: "forged" },
    }));
    expect(onComplete).not.toHaveBeenCalled();

    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://sharptoolz.com",
      source: controller.iframe.contentWindow,
      data: { type: "sharptoolz:completed", documentId: "document-1", sessionId: "session-1" },
    }));
    expect(onComplete).toHaveBeenCalledWith({ documentId: "document-1", sessionId: "session-1" });
  });
});
