/**
 * Utility to inject base64-encoded images into SVG content for download.
 * Proper embedding is REQUIRED for native browser-based rendering (Canvas) to avoid tainting.
 */

const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();

        // Check if it's a JPEG image and re-encode as PNG to avoid compression artifacts
        if (blob.type === "image/jpeg") {
            return new Promise((resolve, reject) => {
                const img = new Image();
                const objectURL = URL.createObjectURL(blob);

                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext("2d");
                        if (!ctx) {
                            URL.revokeObjectURL(objectURL);
                            reject(new Error("Could not get 2D context for canvas."));
                            return;
                        }
                        ctx.drawImage(img, 0, 0);
                        const pngDataUrl = canvas.toDataURL("image/png");
                        URL.revokeObjectURL(objectURL);
                        resolve(pngDataUrl);
                    } catch (e) {
                        URL.revokeObjectURL(objectURL);
                        reject(e);
                    }
                };

                img.onerror = (e) => {
                    URL.revokeObjectURL(objectURL);
                    // Fallback: if re-encoding fails, try to get the original blob as data URL
                    console.warn(`Failed to load JPEG for re-encoding, falling back to original blob: ${e}`);
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                };

                img.src = objectURL;
            });
        } else {
            // For non-JPEG images, or if canvas re-encoding is not desired/possible,
            // just convert the blob directly to base64.
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
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
