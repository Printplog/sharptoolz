/**
 * Utility to inject base64-encoded images into SVG content for download.
 * Proper embedding is REQUIRED for native browser-based rendering (Canvas) to avoid tainting.
 */

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();

        // Return raw, unadulterated base64 image data to preserve color profiles
        // and eliminate banding/ridges in transparent gradients.
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

export async function injectImagesIntoSVG(svgSource: string, baseUrl?: string): Promise<string>;
export async function injectImagesIntoSVG(svgSource: Document, baseUrl?: string): Promise<Document>;
export async function injectImagesIntoSVG(
    svgSource: string | Document,
    baseUrl?: string
): Promise<string | Document> {
    const isDocument = svgSource instanceof Document;
    const doc = isDocument ? (svgSource as Document) : new DOMParser().parseFromString(svgSource as string, "image/svg+xml");
    const images = Array.from(doc.querySelectorAll("image"));

    if (images.length === 0) return svgSource;

    const hrefNS = "http://www.w3.org/1999/xlink";

    for (const img of images) {
        const href = img.getAttribute("href") || img.getAttributeNS(hrefNS, "href");

        // Skip if no href or already base64
        if (!href || href.startsWith("data:")) continue;

        let fullUrl = href;
        if (baseUrl && !/^https?:\/\//i.test(href) && !href.startsWith('blob:')) {
            fullUrl = `${baseUrl}${href.startsWith("/") ? "" : "/"}${href}`;
        }

        const base64 = await fetchImageAsBase64(fullUrl);
        if (base64) {
            img.setAttributeNS(hrefNS, "href", base64);
            img.setAttribute("href", base64);
        }
    }

    if (isDocument) return doc;
    return new XMLSerializer().serializeToString(doc);
}
