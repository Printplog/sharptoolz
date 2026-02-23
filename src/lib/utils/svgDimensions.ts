export function getSvgElementDimensions(svgElementId: string): { width: number; height: number } | null {
    if (!svgElementId) return null;

    // Try multiple times to find the element (in case of timing issues)
    let element = document.getElementById(svgElementId);
    if (!element) {
        // Try to find it in the SVG preview container
        const svgPreview = document.querySelector('[data-svg-preview]');
        if (svgPreview) {
            element = svgPreview.querySelector(`#${svgElementId}`) as HTMLElement;
        }
    }

    if (!element) {
        return null;
    }

    // For image elements, try to get the natural dimensions first
    if (element.tagName === 'image') {
        const img = element as HTMLImageElement;
        if (img.naturalWidth && img.naturalHeight) {
            return { width: img.naturalWidth, height: img.naturalHeight };
        }
    }

    // Get computed style dimensions
    const computedStyle = window.getComputedStyle(element);
    const width = parseFloat(computedStyle.width);
    const height = parseFloat(computedStyle.height);

    // Check if we got valid dimensions
    if (width && height && width > 0 && height > 0) {
        return { width, height };
    }

    // Fallback to getBoundingClientRect if computed style doesn't work
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
}
