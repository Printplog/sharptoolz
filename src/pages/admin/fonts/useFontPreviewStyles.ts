import { useEffect, useMemo } from "react";
import type { Font } from "@/types";

/**
 * Injects @font-face rules for previewing fonts in the table.
 * Automatically cleans up injected styles on unmount.
 */
export function useFontPreviewStyles(fonts: Font[]) {
    const injectPreviewStyles = useMemo(() => {
        if (!fonts.length) return "";

        const getFontFormat = (url: string | undefined): string => {
            if (!url) return "truetype";
            if (url.endsWith(".woff2")) return "woff2";
            if (url.endsWith(".woff")) return "woff";
            if (url.endsWith(".otf")) return "opentype";
            return "truetype";
        };

        return fonts
            .filter((font) => font.font_url)
            .map(
                (font) => `
        @font-face {
          font-family: "FontPreview-${font.id}";
          src: url("${font.font_url}") format("${getFontFormat(font.font_url)}");
          font-display: swap;
        }
      `
            )
            .join("\n");
    }, [fonts]);

    useEffect(() => {
        if (!injectPreviewStyles) return;
        const styleId = "fonts-preview-style";
        if (typeof document === "undefined") return;

        let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }
        styleEl.textContent = injectPreviewStyles;

        return () => {
            if (styleEl?.parentNode) {
                styleEl.parentNode.removeChild(styleEl);
            }
        };
    }, [injectPreviewStyles]);
}
