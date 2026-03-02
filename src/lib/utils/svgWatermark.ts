/**
 * Frontend SVG Watermark Utility
 *
 * Injects "FAKE DOCUMENT" watermarks into an SVG string for preview display.
 * This mirrors the backend's WaterMark class but runs client-side.
 *
 * Rules:
 * - Non-purchased template (browsing /tools/:id): always apply watermark
 * - Purchased template (/documents/:id): only apply if `test === true`
 */

export function addWatermarkToSvg(svgContent: string): string {
    if (!svgContent || !svgContent.includes("</svg>")) return svgContent;

    // Parse dimensions from viewBox or width/height attrs
    let width = 400;
    let height = 300;

    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/\s+/);
        if (parts.length >= 4) {
            width = parseFloat(parts[2]);
            height = parseFloat(parts[3]);
        }
    } else {
        const wMatch = svgContent.match(/\bwidth=["']([^"'px]+)/);
        const hMatch = svgContent.match(/\bheight=["']([^"'px]+)/);
        if (wMatch) width = parseFloat(wMatch[1]);
        if (hMatch) height = parseFloat(hMatch[1]);
    }

    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return svgContent;

    // Fixed font size and spacing — same on every document size.
    // Bigger documents just get more watermarks, not wider gaps.
    const fontSize = 42;
    const squareSize = 380; // fixed px spacing between watermark centers

    // Extra padding on each side to push watermarks beyond visible edges
    // so the outermost rows/cols visually touch the border
    const bleed = squareSize * 0.5;

    const startX = -bleed;
    const startY = -bleed;
    const endX = width + bleed;
    const endY = height + bleed;

    const cols = Math.ceil((endX - startX) / squareSize) + 1;
    const rows = Math.ceil((endY - startY) / squareSize) + 1;

    const watermarks: string[] = [];

    for (let r = 0; r < rows; r++) {
        // Stagger alternate rows by half a column for a nice diagonal spread
        const offsetX = r % 2 === 0 ? 0 : squareSize / 2;

        for (let c = 0; c < cols; c++) {
            const cx = startX + offsetX + c * squareSize;
            const cy = startY + r * squareSize;

            watermarks.push(
                `<g transform="rotate(-45, ${cx.toFixed(1)}, ${cy.toFixed(1)})" pointer-events="none">` +
                `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" ` +
                `font-size="${fontSize}" font-weight="900" font-family="Arial, sans-serif" ` +
                `fill="black" text-anchor="middle" ` +
                `letter-spacing="2" pointer-events="none">FAKE DOCUMENT</text>` +
                `</g>`
            );
        }
    }

    if (watermarks.length === 0) return svgContent;

    const insertPos = svgContent.lastIndexOf("</svg>");
    return (
        svgContent.slice(0, insertPos) +
        "\n<!-- watermark-start -->\n" +
        watermarks.join("\n") +
        "\n<!-- watermark-end -->\n" +
        svgContent.slice(insertPos)
    );
}

export function removeWatermarkFromSvg(svgContent: string): string {
    if (!svgContent) return svgContent;
    // Remove injected watermark block
    return svgContent.replace(
        /\n<!-- watermark-start -->[\s\S]*?<!-- watermark-end -->\n/g,
        ""
    );
}
