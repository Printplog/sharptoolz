/**
 * Utility to inject base64-encoded images into SVG content for download.
 * Proper embedding is REQUIRED for native browser-based rendering (Canvas) to avoid tainting.
 */

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
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
        console.error(`Failed to fetch image from ${url}:`, e);
        return null;
    }
};

export async function injectImagesIntoSVG(
    svgContent: string,
    baseUrl?: string
): Promise<string> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const images = Array.from(doc.querySelectorAll("image"));

    if (images.length === 0) return svgContent;

    const hrefNS = "http://www.w3.org/1999/xlink";

    for (const img of images) {
        const href = img.getAttribute("href") || img.getAttributeNS(hrefNS, "href");

        // Skip if no href or already base64/blob
        if (!href || href.startsWith("data:") || href.startsWith("blob:")) continue;

        let fullUrl = href;
        if (baseUrl && !/^https?:\/\//i.test(href)) {
            fullUrl = `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
        }

        const base64 = await fetchImageAsBase64(fullUrl);
        if (base64) {
            img.setAttributeNS(hrefNS, "href", base64);
            img.setAttribute("href", base64);
        }
    }

    return new XMLSerializer().serializeToString(doc);
}
