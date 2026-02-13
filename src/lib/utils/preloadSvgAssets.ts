/**
 * Preloads all images referenced in an SVG string.
 * Returns a promise that resolves when all images are loaded or failed.
 */
export async function preloadSvgImages(svgContent: string): Promise<void> {
    if (!svgContent) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, "image/svg+xml");
    const imageElements = Array.from(doc.querySelectorAll("image"));

    const imageUrls = imageElements
        .map(img => img.getAttribute("href") || img.getAttribute("xlink:href"))
        .filter((url): url is string => !!url && !url.startsWith("data:") && !url.startsWith("blob:"));

    if (imageUrls.length === 0) return;

    console.log(`[preloadSvgImages] Preloading ${imageUrls.length} images...`);

    const preloadPromises = imageUrls.map(url => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => {
                console.warn(`[preloadSvgImages] Failed to load image: ${url}`);
                resolve(); // Resolve anyway to not block the UI forever
            };
            img.src = url;
        });
    });

    await Promise.all(preloadPromises);
    console.log(`[preloadSvgImages] All images preloaded.`);
}
