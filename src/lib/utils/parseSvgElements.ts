// lib/utils/parseSvgElements.ts

export type SvgElement = {
  id?: string;
  originalId?: string;
  internalId?: string;
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
      const internalId = el.getAttribute("data-internal-id") || undefined;

      const attributes = Object.fromEntries(
        Array.from(el.attributes).map(attr => [attr.name, attr.value])
      );

      // Smart text extraction: Handle tspans for multiline text
      // Smart text extraction: Handle mixed content (text nodes + tspans)
      let innerText = "";
      const hasTspans = el.querySelectorAll("tspan").length > 0;

      if (hasTspans) {
        // Iterate child nodes to capture text in order, handling both direct text and tspans
        innerText = Array.from(el.childNodes)
          .map(node => {
            if (node.nodeType === 3) { // Text node
              return node.textContent?.trim() || "";
            }
            if (node.nodeType === 1 && (node as Element).tagName.toLowerCase() === "tspan") {
              return node.textContent || "";
            }
            return "";
          })
          .filter(text => text.length > 0)
          .join("\n");
      } else {
        // Fallback to standard textContent for simple elements
        innerText = el.textContent?.trim() || "";
      }

      innerText = innerText.length > 0 ? innerText : "";

      // Exclude element if its text content is exactly "test document" (case-insensitive)
      if (innerText && innerText.toLowerCase() === "test document") {
        return null;
      }

      return {
        tag,
        id: id || internalId,
        originalId: id,
        internalId,
        attributes,
        innerText: innerText || undefined, // Keep original case!
      };
    })
    .filter(Boolean) as SvgElement[];
}
