// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import HostedFormThemePreview from "./HostedFormThemePreview";
import { DEFAULT_API_THEME } from "@/lib/apiTheme";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("HostedFormThemePreview", () => {
  let container: HTMLDivElement | null = null;
  let root: ReturnType<typeof createRoot> | null = null;

  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    container?.remove();
    container = null;
    root = null;
  });

  it("applies the selected corner radius to every representative form control", async () => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);

    await act(async () => {
      root?.render(<HostedFormThemePreview theme={{ ...DEFAULT_API_THEME, borderRadius: "24px" }} />);
    });

    const controls = Array.from(container.querySelectorAll<HTMLElement>("[data-preview-control]"));
    expect(controls.length).toBeGreaterThanOrEqual(7);
    expect(controls.every((control) => control.style.borderRadius === "24px")).toBe(true);

    await act(async () => {
      root?.render(<HostedFormThemePreview theme={{ ...DEFAULT_API_THEME, borderRadius: "0px" }} />);
    });

    expect(Array.from(container.querySelectorAll<HTMLElement>("[data-preview-control]"))
      .every((control) => control.style.borderRadius === "0px")).toBe(true);
  });
});
