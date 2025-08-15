// lib/utils/parseSvgElements.ts

export type SvgElement = {
  id?: string;
  tag: string;
  attributes: Record<string, string>;
  innerText?: string;
}

export default function parseSvgElements(svgString: string): SvgElement[] {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
  const elements = Array.from(svgDoc.querySelectorAll("*"));

  return elements
    .filter(el => el.tagName.toLowerCase() !== "svg") // skip root
    .map(el => {
      const tag = el.tagName.toLowerCase();
      const id = el.getAttribute("id") || undefined;
      const attributes = Object.fromEntries(
        Array.from(el.attributes).map(attr => [attr.name, attr.value])
      );
      // Always lowercase text content for comparison
      const rawText = el.textContent?.trim() || "";
      const innerText = rawText.length > 0 ? rawText : undefined;

      // Exclude element if its text content is exactly "test document" (case-insensitive)
      if (innerText && innerText.toLowerCase() === "test document") {
        return null;
      }

      return {
        tag,
        id,
        attributes,
        innerText: innerText ? innerText.toLowerCase() : undefined,
      };
    })
    .filter(Boolean) as SvgElement[];
}
