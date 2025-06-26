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
    .filter(el => el.tagName !== "svg") // skip root
    .map(el => ({
      tag: el.tagName,
      id: el.getAttribute("id") || undefined,
      attributes: Object.fromEntries(
        Array.from(el.attributes).map(attr => [attr.name, attr.value])
      ),
      innerText: el.textContent?.trim() || undefined,
    }));
}
