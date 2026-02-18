/**
 * Utility to inject @font-face declarations into SVG content for frontend preview
 */
import type { Font } from "@/types";

type FontFaceTuple = { family: string; css: string };

const buildFontFace = (family: string, url: string, format: string) => {
  return `@font-face {
  font-family: "${family}";
  src: url("${url}") format("${format}");
  font-weight: normal;
  font-style: normal;
}`;
};



const normalizeFontKey = (name?: string | null) =>
  (name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();

const stripQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "");

const collectFontFamilyAliases = (doc: Document) => {
  const aliasMap = new Map<string, string>();
  const pushAlias = (value?: string | null) => {
    if (!value) return;
    const firstFamily = stripQuotes(value.split(",")[0].trim());
    const key = normalizeFontKey(firstFamily);
    if (key && !aliasMap.has(key)) {
      aliasMap.set(key, firstFamily);
    }
  };

  Array.from(doc.querySelectorAll("style")).forEach((styleEl) => {
    const text = styleEl.textContent || "";
    const regex = /font-family\s*:\s*([^;]+);/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      pushAlias(match[1]);
    }
  });

  Array.from(doc.querySelectorAll<HTMLElement>("[style]")).forEach((el) => {
    const styleText = el.getAttribute("style") || "";
    const regex = /font-family\s*:\s*([^;]+);?/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(styleText))) {
      pushAlias(match[1]);
    }
  });

  Array.from(doc.querySelectorAll<HTMLElement>("[font-family]")).forEach((el) => {
    pushAlias(el.getAttribute("font-family"));
  });

  return aliasMap;
};

const getFileNameStem = (path?: string | null) => {
  if (!path) return "";
  const lastSegment = path.split(/[\\/]/).pop();
  if (!lastSegment) return "";
  const [stem] = lastSegment.split(".");
  return stem || "";
};

const fetchFontAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error(`Failed to fetch font from ${url}:`, e);
    return null;
  }
};

export async function injectFontsIntoSVG(
  svgContent: string,
  fonts: Font[],
  baseUrl?: string,
  embedBase64: boolean = false
): Promise<string> {
  if (!fonts || fonts.length === 0) {
    return svgContent;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");
  const rootEl = doc.documentElement;
  if (!rootEl || rootEl.nodeName.toLowerCase() !== "svg") {
    return svgContent;
  }
  if (!(rootEl instanceof SVGSVGElement)) {
    return svgContent;
  }
  const svgEl = rootEl;
  const aliasMap = collectFontFamilyAliases(doc);

  const namespace = svgEl.namespaceURI || "http://www.w3.org/2000/svg";
  let defsEl = svgEl.querySelector("defs") as (SVGDefsElement | null);
  if (!defsEl) {
    defsEl = doc.createElementNS(namespace, "defs") as SVGDefsElement;
    if (svgEl.firstChild) {
      svgEl.insertBefore(defsEl, svgEl.firstChild);
    } else {
      svgEl.appendChild(defsEl);
    }
  }

  const fontFaces: FontFaceTuple[] = [];

  for (const font of fonts) {
    const rawUrl = font.font_url || font.font_file;
    if (!rawUrl) continue;
    let fontUrl = baseUrl && !/^https?:\/\//i.test(rawUrl) ? `${baseUrl}${rawUrl}` : rawUrl;

    const ext = fontUrl.split(".").pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      ttf: "truetype",
      otf: "opentype",
      woff: "woff",
      woff2: "woff2",
    };
    const fontFormat = formatMap[ext || ""] || "truetype";

    if (embedBase64) {
      const base64 = await fetchFontAsBase64(fontUrl);
      if (base64) {
        fontUrl = base64;
      }
    }

    const candidates = [
      font.name,
      getFileNameStem(font.font_file || font.font_url),
    ].filter(Boolean) as string[];

    let cssFamily = font.name;
    for (const candidate of candidates) {
      const key = normalizeFontKey(candidate);
      if (key && aliasMap.has(key)) {
        cssFamily = aliasMap.get(key)!;
        break;
      }
    }

    if (!cssFamily) {
      cssFamily = font.name || candidates[0] || "CustomFont";
    }

    fontFaces.push({
      family: cssFamily,
      css: buildFontFace(cssFamily, fontUrl, fontFormat),
    });
  }

  if (fontFaces.length === 0) {
    return svgContent;
  }

  const existingStyle = defsEl.querySelector('style[data-font-injector="true"]') as (SVGStyleElement | null);
  const styleEl =
    existingStyle ||
    (() => {
      const el = doc.createElementNS(namespace, "style");
      el.setAttribute("type", "text/css");
      el.setAttribute("data-font-injector", "true");
      if (defsEl.firstChild) {
        defsEl.insertBefore(el, defsEl.firstChild);
      } else {
        defsEl.appendChild(el);
      }
      return el;
    })();

  // If embedding base64, we might want to replace existing font-faces
  if (embedBase64) {
    styleEl.textContent = fontFaces.map(({ css }) => css).join("\n");
  } else {
    const existingFamilies = new Set<string>();
    if (styleEl.textContent) {
      const matches = styleEl.textContent.match(/font-family:\s*"([^"]+)"/g) || [];
      matches.forEach((match) => {
        const familyMatch = match.match(/font-family:\s*"([^"]+)"/);
        if (familyMatch?.[1]) {
          existingFamilies.add(familyMatch[1]);
        }
      });
    }

    const cssToInject = fontFaces
      .filter(({ family }) => !existingFamilies.has(family))
      .map(({ css }) => css);

    if (cssToInject.length > 0) {
      const newCss = `${styleEl.textContent?.trim() ? styleEl.textContent.trim() + "\n" : ""}${cssToInject.join(
        "\n"
      )}\n`;
      styleEl.textContent = newCss;
    }
  }

  return new XMLSerializer().serializeToString(doc);
}


