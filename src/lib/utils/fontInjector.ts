/**
 * Utility to inject @font-face declarations into SVG content for frontend preview
 */
import type { Font } from "@/types";

type FontFaceTuple = { family: string; weight: string; style: string; key: string; css: string };

const buildFontFace = (
  family: string,
  url: string,
  format: string,
  weight: string = "normal",
  style: string = "normal"
) => {
  return `@font-face {
  font-family: "${family}";
  src: url("${url}") format("${format}");
  font-weight: ${weight};
  font-style: ${style};
}`;
};



const normalizeFontKey = (name?: string | null) =>
  (name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();

const normalizeWeight = (weight?: string | null) => {
  const value = (weight || "normal").trim().toLowerCase();
  const compact = value.replace(/[\s_-]+/g, "");
  const namedWeights: Record<string, string> = {
    normal: "400", regular: "400", thin: "100", hairline: "100",
    extralight: "200", ultralight: "200", light: "300", book: "400",
    medium: "500", semibold: "600", demibold: "600", bold: "700",
    extrabold: "800", ultrabold: "800", black: "900", heavy: "900",
  };
  if (namedWeights[compact]) return namedWeights[compact];
  return value;
};

const normalizeStyle = (style?: string | null) => {
  const value = (style || "normal").trim().toLowerCase();
  return value === "regular" ? "normal" : value;
};

const inferVariant = (name: string, configuredWeight?: string, configuredStyle?: string) => {
  const words = name.toLowerCase().replace(/[_-]+/g, " ");
  const explicitWeight = normalizeWeight(configuredWeight);
  let weight = explicitWeight;

  // Older uploads commonly left every face as "normal". Recover the canonical
  // CSS descriptor from well-known face names so Arial Black/Bold/Italic do not
  // compete for Arial's regular slot.
  if (explicitWeight === "400") {
    if (/\b(black|heavy)\b/.test(words)) weight = "900";
    else if (/\b(extra|ultra)\s*bold\b/.test(words)) weight = "800";
    else if (/\b(semi|demi)\s*bold\b/.test(words)) weight = "600";
    else if (/\bbold\b/.test(words)) weight = "700";
    else if (/\bmedium\b/.test(words)) weight = "500";
    else if (/\b(extra|ultra)\s*light\b/.test(words)) weight = "200";
    else if (/\blight\b/.test(words)) weight = "300";
    else if (/\bthin\b/.test(words)) weight = "100";
  }

  const explicitStyle = normalizeStyle(configuredStyle);
  const style = explicitStyle === "normal" && /\b(italic|oblique)\b/.test(words)
    ? (words.includes("oblique") ? "oblique" : "italic")
    : explicitStyle;

  return { weight, style };
};

const normalizeVariantKey = (family?: string | null, weight: string = "normal", style: string = "normal") =>
  `${normalizeFontKey(family)}_${normalizeWeight(weight)}_${normalizeStyle(style)}`;

const stripQuotes = (value: string) => value.replace(/^['"]|['"]$/g, "");

const extractDeclaration = (css: string, property: string) => {
  const match = css.match(new RegExp(`${property}\\s*:\\s*([^;}]+)`, "i"));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, "");
};

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

    const ext = fontUrl.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
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

    const variant = inferVariant(font.name || "", font.weight, font.style);

    // A template can reference the full face name ("Arial Black") while the
    // record only carries the bare family ("Arial"). Emitting every such
    // record under the bare family collapses all faces onto one @font-face
    // descriptor, so a single file wins for every text. Emit the exact face
    // name for direct references and the canonical family with the inferred
    // weight/style descriptor.
    const emitFaces: Array<{ family: string; weight: string; style: string }> = [];
    const addFace = (family: string, weight: string, style: string) => {
      const key = normalizeVariantKey(family, weight, style);
      if (!emitFaces.some((face) => normalizeVariantKey(face.family, face.weight, face.style) === key)) {
        emitFaces.push({ family, weight: normalizeWeight(weight), style: normalizeStyle(style) });
      }
    };
    const nameKey = normalizeFontKey(font.name);
    if (nameKey && aliasMap.has(nameKey)) {
      const exactFamily = aliasMap.get(nameKey)!;
      // A full face name is already a distinct CSS family. Support SVGs that
      // reference it with either default descriptors or explicit ones.
      addFace(exactFamily, "400", "normal");
      addFace(exactFamily, variant.weight, variant.style);
    }

    let familyCandidate = font.family || "";
    if (!familyCandidate) {
      const candidates = [
        font.name,
        getFileNameStem(font.font_file || font.font_url),
      ].filter(Boolean) as string[];

      for (const candidate of candidates) {
        const key = normalizeFontKey(candidate);
        if (key && aliasMap.has(key)) {
          familyCandidate = aliasMap.get(key)!;
          break;
        }
      }

      if (!familyCandidate) {
        familyCandidate = font.name || candidates[0] || "CustomFont";
      }
    }
    if (familyCandidate) addFace(familyCandidate, variant.weight, variant.style);

    for (const face of emitFaces) {
      fontFaces.push({
        family: face.family,
        weight: face.weight,
        style: face.style,
        key: normalizeVariantKey(face.family, face.weight, face.style),
        css: buildFontFace(face.family, fontUrl, fontFormat, face.weight, face.style),
      });
    }
  }

  if (fontFaces.length === 0) {
    return svgContent;
  }

  // First file wins a descriptor slot so sibling faces can never collapse
  // onto one @font-face and repeated injections stay deterministic.
  const seenVariants = new Set<string>();
  const uniqueFaces = fontFaces.filter(({ key }) => {
    if (seenVariants.has(key)) return false;
    seenVariants.add(key);
    return true;
  });

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
    styleEl.textContent = uniqueFaces.map(({ css }) => css).join("\n");
  } else {
    const existingVariants = new Set<string>();
    if (styleEl.textContent) {
      const fontFaceBlocks = styleEl.textContent.match(/@font-face\s*\{[^}]*\}/gi) || [];
      fontFaceBlocks.forEach((block) => {
        const family = extractDeclaration(block, "font-family");
        if (!family) return;
        const weight = extractDeclaration(block, "font-weight") || "normal";
        const style = extractDeclaration(block, "font-style") || "normal";
        existingVariants.add(normalizeVariantKey(family, weight, style));
      });
    }

    const cssToInject = uniqueFaces
      .filter(({ key }) => !existingVariants.has(key))
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
