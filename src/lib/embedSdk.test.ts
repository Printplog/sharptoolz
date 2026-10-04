// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountHostedForm } from "../../packages/sharptoolz-sdk/src/browser.js";

type SharpToolzSdk = {
  mount: (target: HTMLElement, options: {
    embedUrl: string;
    loading?: false | {
      text?: string;
      logoUrl?: string;
      backgroundColor?: string;
      textColor?: string;
      accentColor?: string;
      element?: HTMLElement;
    };
    onReady?: () => void;
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

  it("shows a neutral unbranded loader until a trusted ready message arrives", () => {
    const sdk = loadSdk();
    const target = document.createElement("div");
    document.body.append(target);
    const onReady = vi.fn();
    const controller = sdk.mount(target, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      onReady,
    });

    const loader = target.querySelector<HTMLElement>("[data-sharptoolz-loader]");
    expect(loader).not.toBeNull();
    expect(loader?.textContent).toContain("Loading form…");
    expect(loader?.textContent).not.toMatch(/sharptoolz/i);
    expect(controller.iframe.style.visibility).toBe("hidden");
    expect(controller.iframe.getAttribute("aria-hidden")).toBe("true");

    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://attacker.example",
      source: controller.iframe.contentWindow,
      data: { type: "sharptoolz:ready" },
    }));
    expect(target.querySelector("[data-sharptoolz-loader]")).not.toBeNull();

    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://sharptoolz.com",
      source: controller.iframe.contentWindow,
      data: { type: "sharptoolz:ready" },
    }));
    expect(target.querySelector("[data-sharptoolz-loader]")).toBeNull();
    expect(controller.iframe.style.visibility).toBe("visible");
    expect(controller.iframe.hasAttribute("aria-hidden")).toBe(false);
    expect(onReady).toHaveBeenCalledOnce();
  });

  it("supports styled, custom-element, and disabled loading states", () => {
    const sdk = loadSdk();
    const styledTarget = document.createElement("div");
    const customTarget = document.createElement("div");
    const disabledTarget = document.createElement("div");
    document.body.append(styledTarget, customTarget, disabledTarget);

    sdk.mount(styledTarget, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      loading: {
        text: "Preparing your policy…",
        logoUrl: "/customer-logo.svg",
        backgroundColor: "#ffffff",
        textColor: "#17362f",
        accentColor: "#176b5b",
      },
    });
    const styledLoader = styledTarget.querySelector<HTMLElement>("[data-sharptoolz-loader]");
    expect(styledLoader?.textContent).toContain("Preparing your policy…");
    expect(styledLoader?.style.background).toBe("rgb(255, 255, 255)");
    expect(styledLoader?.querySelector("img")?.getAttribute("src")).toBe("/customer-logo.svg");

    const customerSkeleton = document.createElement("div");
    customerSkeleton.dataset.customerSkeleton = "";
    sdk.mount(customTarget, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      loading: { element: customerSkeleton },
    });
    expect(customTarget.querySelector("[data-customer-skeleton]".trim())).toBe(customerSkeleton);

    const disabled = sdk.mount(disabledTarget, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      loading: false,
    });
    expect(disabledTarget.querySelector("[data-sharptoolz-loader]")).toBeNull();
    expect(disabled.iframe.style.visibility).toBe("visible");
  });
});

describe("package hosted-form loader", () => {
  it("uses the same styled loader contract and reveals only on a trusted ready message", () => {
    const target = document.createElement("div");
    document.body.append(target);
    const onReady = vi.fn();
    const controller = mountHostedForm(target, {
      embedUrl: `https://sharptoolz.com/embed#${validToken}`,
      loading: { text: "Opening Acme form", accentColor: "#123456" },
      onReady,
    });

    expect(target.querySelector("[data-sharptoolz-loader]")?.textContent).toContain("Opening Acme form");
    window.dispatchEvent(new MessageEvent("message", {
      origin: "https://sharptoolz.com",
      source: controller.iframe.contentWindow,
      data: { type: "sharptoolz:ready" },
    }));
    expect(target.querySelector("[data-sharptoolz-loader]")).toBeNull();
    expect(onReady).toHaveBeenCalledOnce();
    controller.destroy();
  });
});
