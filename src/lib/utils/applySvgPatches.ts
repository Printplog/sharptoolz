import type { SvgPatch } from '@/types';

/**
 * Applies a list of SVG patches to an SVG string in the browser.
 * This mirrors the backend's svg_utils logic.
 */
export function applySvgPatches(svgContent: string, patches: SvgPatch[]): string {
    if (!svgContent) {
        return svgContent;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgContent, "image/svg+xml");
        const svg = doc.querySelector("svg");

        if (!svg) {
            console.error("applySvgPatches: No SVG element found in content");
            return svgContent;
        }

        // 1. Ensure all elements have deterministic IDs (matching the Admin's algorithm)
        const allElements = Array.from(doc.querySelectorAll("*")).filter(el => el.tagName.toLowerCase() !== "svg");
        const idCount: Record<string, number> = {};

        const nonEditableTags = [
            'defs', 'style', 'lineargradient', 'radialgradient',
            'pattern', 'clippath', 'mask', 'filter', 'fegaussianblur', 'feoffset', 'feflood', 'fecomposite', 'femerge', 'femergenode'
        ];

        allElements.forEach((domEl) => {
            const tag = domEl.tagName.toLowerCase();

            // SKIP logic must match useSvgStore.ts exactly
            if (nonEditableTags.includes(tag)) return;

            // Smart text extraction matching useSvgStore.ts
            let innerText = "";
            const hasTspans = domEl.querySelectorAll("tspan").length > 0;
            if (hasTspans) {
                innerText = Array.from(domEl.childNodes)
                    .map(node => {
                        if (node.nodeType === 3) return node.textContent?.trim() || "";
                        if (node.nodeType === 1 && (node as Element).tagName.toLowerCase() === "tspan") return node.textContent || "";
                        return "";
                    })
                    .filter(text => text.length > 0)
                    .join("\n");
            } else {
                innerText = domEl.textContent?.trim() || "";
            }

            if (innerText.toLowerCase() === "test document") return;

            const existingId = domEl.getAttribute("id");
            const existingInternalId = domEl.getAttribute("data-internal-id");

            const baseId = existingId || existingInternalId || `el-${tag}`;
            idCount[baseId] = (idCount[baseId] || 0) + 1;
            const finalId = idCount[baseId] > 1 ? `${baseId}_${idCount[baseId]}` : baseId;

            domEl.setAttribute('data-internal-id', finalId);
        });

        // 2. Apply patches if any
        if (patches && patches.length > 0) {
            console.log(`[applySvgPatches] Applying ${patches.length} patches`);
            let appliedCount = 0;

            patches.forEach((patch) => {
                const { id, attribute, value } = patch;
                if (!id || !attribute) return;

                // Try multiple selectors to find the element
                const element =
                    doc.getElementById(id) ||
                    doc.querySelector(`[data-internal-id="${id}"]`) ||
                    doc.querySelector(`[name="${id}"]`) ||
                    doc.querySelector(`[data-name="${id}"]`);

                if (element) {
                    if (attribute === 'innerText') {
                        element.textContent = String(value);
                        appliedCount++;
                    } else if (attribute === 'reorder') {
                        const reorderData = value as { afterId?: string | null; beforeId?: string | null };
                        const parent = element.parentElement;
                        if (!parent) return;

                        let refEl: Element | null = null;
                        let moveAfter = false;

                        if (reorderData.beforeId) {
                            refEl = doc.getElementById(reorderData.beforeId) || doc.querySelector(`[data-internal-id="${reorderData.beforeId}"]`);
                            moveAfter = true;
                        }

                        if (!refEl && reorderData.afterId) {
                            refEl = doc.getElementById(reorderData.afterId) || doc.querySelector(`[data-internal-id="${reorderData.afterId}"]`);
                            moveAfter = false;
                        }

                        if (refEl && refEl.parentElement === parent) {
                            if (moveAfter) {
                                refEl.after(element);
                            } else {
                                refEl.before(element);
                            }
                            appliedCount++;
                        }
                    } else {
                        if (value === null || value === "") {
                            element.removeAttribute(attribute);
                        } else {
                            element.setAttribute(attribute, String(value));
                        }
                        appliedCount++;
                    }
                }
            });
            console.log(`[applySvgPatches] Successfully applied ${appliedCount}/${patches.length} patches`);
        }

        // Serialize back to string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    } catch (err) {
        console.error("applySvgPatches: Error applying patches", err);
        return svgContent;
    }
}
