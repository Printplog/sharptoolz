import type { SvgPatch } from '@/types';

/**
 * Applies a list of SVG patches to an SVG string in the browser.
 * This mirrors the backend's svg_utils logic.
 */
export function applySvgPatches(svgContent: string, patches: SvgPatch[]): string {
    if (!patches || patches.length === 0 || !svgContent) {
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
                    // Reorder logic: value is { afterId: string | null, beforeId: string | null }
                    const reorderData = value as { afterId?: string | null; beforeId?: string | null };
                    const parent = element.parentElement;
                    if (!parent) return;

                    let refEl: Element | null = null;
                    let moveAfter = false;

                    if (reorderData.beforeId) {
                        refEl = doc.getElementById(reorderData.beforeId);
                        moveAfter = true;
                    }

                    if (!refEl && reorderData.afterId) {
                        refEl = doc.getElementById(reorderData.afterId);
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
                    // Default attribute setting
                    if (value === null || value === "") {
                        element.removeAttribute(attribute);
                    } else {
                        element.setAttribute(attribute, String(value));
                    }
                    appliedCount++;
                }
            }
        });

        // Serialize back to string
        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    } catch (err) {
        console.error("applySvgPatches: Error applying patches", err);
        return svgContent;
    }
}
