/**
 * Ensures every element in an SVG has a unique ID or data-internal-id.
 * This is crucial for the patch system to work correctly when elements
 * don't have native IDs.
 */
export function ensureSvgElementIds(svgContent: string): string {
    if (!svgContent) return svgContent;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const allElements = Array.from(doc.querySelectorAll("*")).filter(el => el.tagName.toLowerCase() !== "svg");

        const idCount: Record<string, number> = {};

        allElements.forEach((domEl) => {
            const tag = domEl.tagName.toLowerCase();
            const existingId = domEl.getAttribute("id");
            const existingInternalId = domEl.getAttribute("data-internal-id");

            // If it already has an ID, we prioritize it
            let baseId = existingId || existingInternalId || `el-${tag}`;

            // Deduplicate across the document
            idCount[baseId] = (idCount[baseId] || 0) + 1;
            const finalId = idCount[baseId] > 1 ? `${baseId}_${idCount[baseId]}` : baseId;

            // Always set data-internal-id for consistency with the store
            domEl.setAttribute('data-internal-id', finalId);
        });

        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    } catch (err) {
        console.error("ensureSvgElementIds: Error processing SVG", err);
        return svgContent;
    }
}
