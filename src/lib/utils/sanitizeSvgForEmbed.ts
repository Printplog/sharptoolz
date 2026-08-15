const BLOCKED_ELEMENTS = new Set([
  "script",
  "foreignobject",
  "iframe",
  "object",
  "embed",
  "audio",
  "video",
  "animate",
  "animatemotion",
  "animatetransform",
  "set",
  "mpath",
]);

const SAFE_DATA_IMAGE = /^data:image\/(?:png|jpeg|jpg|webp);base64,/i;
const LEGACY_SAFE_DATA_IMAGE = /^data:img\/(?:png|jpeg|jpg|webp);base64,/i;

function normalizeSafeDataImage(value: string) {
  if (SAFE_DATA_IMAGE.test(value)) return value;
  if (LEGACY_SAFE_DATA_IMAGE.test(value)) {
    return value.replace(/^data:img\//i, "data:image/");
  }
  return null;
}

function hasUnsafeCss(value: string) {
  if (/(?:expression\s*\(|javascript:|@import|-moz-binding|behavior\s*:)/i.test(value)) {
    return true;
  }
  if (/\\/.test(value) && /(?:url|import|script|binding|behavior)/i.test(value.replace(/\\/g, ""))) {
    return true;
  }
  for (const match of value.matchAll(/url\s*\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
    const target = match[2].trim();
    if (!target.startsWith("#") && !SAFE_DATA_IMAGE.test(target)) return true;
  }
  return false;
}

/**
 * The embed displays administrator-authored SVG, but it still crosses a trust
 * boundary into a customer's website. Strip executable elements, event
 * handlers, remote resource loads, and javascript URLs before DOM insertion.
 */
export function sanitizeSvgForEmbed(svg: string): string {
  const documentNode = new DOMParser().parseFromString(svg, "image/svg+xml");
  const parserError = documentNode.querySelector("parsererror");
  const root = documentNode.documentElement;
  if (parserError || root.tagName.toLowerCase() !== "svg") {
    throw new Error("The template SVG is invalid.");
  }

  for (const element of [root, ...Array.from(root.querySelectorAll("*"))]) {
    if (BLOCKED_ELEMENTS.has(element.tagName.toLowerCase())) {
      element.remove();
      continue;
    }

    if (element.tagName.toLowerCase() === "style" && hasUnsafeCss(element.textContent || "")) {
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith("on") || value.startsWith("javascript:") || hasUnsafeCss(attribute.value)) {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (name === "href" || name === "xlink:href") {
        if (value.startsWith("#")) continue;
        const safeDataImage = normalizeSafeDataImage(attribute.value.trim());
        if (safeDataImage) {
          attribute.value = safeDataImage;
        } else {
          element.removeAttribute(attribute.name);
        }
      }
    }
  }

  return new XMLSerializer().serializeToString(root);
}
