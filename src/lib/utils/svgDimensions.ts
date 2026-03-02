export function getSvgElementDimensions(svgElementId: string): { width: number; height: number } | null {
    if (!svgElementId) return null;

    let element: Element | null = document.getElementById(svgElementId);
    if (!element) {
        const svgPreview = document.querySelector('[data-svg-preview]');
        if (svgPreview) {
            element = svgPreview.querySelector(`#${CSS.escape(svgElementId)}`);
        }
    }

    if (!element) {
        return null;
    }

    // PRIORITY 1: Use raw SVG/HTML attributes — these reflect the template's
    // intended dimensions, not a CSS-scaled visual size.
    const attrW = element.getAttribute('width');
    const attrH = element.getAttribute('height');
    if (attrW && attrH) {
        const w = parseFloat(attrW);
        const h = parseFloat(attrH);
        if (w > 0 && h > 0) {
            return { width: w, height: h };
        }
    }

    // PRIORITY 2: getBoundingClientRect (visual size, less accurate in scaled SVGs)
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height };
    }

    return null;
}
