import { jsPDF } from 'jspdf';

/**
 * Utility for client-side document generation
 */

export interface GenerateOptions {
    filename?: string;
    quality?: number;
    renderScaleMultiplier?: number;
    jpegQuality?: number;
    split?: {
        direction: 'horizontal' | 'vertical';
        side: 'front' | 'back';
    };
}

/**
 * Detects if the browser is Opera Mini
 */
export function isOperaMini(): boolean {
    const userAgent = navigator.userAgent;
    return (
        userAgent.includes('Opera Mini') ||
        (window as { operamini?: unknown }).operamini !== undefined ||
        userAgent.includes('OPios') || // Opera on iOS
        userAgent.includes('OPR/')   // Opera for Android
    );
}

/**
 * Detects if the browser is Safari (including iOS Safari)
 */
export function isSafari(): boolean {
    const userAgent = navigator.userAgent;
    return (
        userAgent.includes('Safari') &&
        !userAgent.includes('Chrome') &&
        !userAgent.includes('Chromium')
    );
}

/**
 * Extracted dimensions from SVG
 */
function getSvgDimensions(doc: Document): { width: number, height: number } {
    const svgEl = doc.documentElement;
    let width = parseInt(svgEl.getAttribute('width') || '');
    let height = parseInt(svgEl.getAttribute('height') || '');

    if (isNaN(width) || isNaN(height)) {
        const viewBox = svgEl.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.split(/[,\s]+/).map(Number);
            if (parts.length === 4) {
                if (isNaN(width)) width = parts[2];
                if (isNaN(height)) height = parts[3];
            }
        }
    }

    return {
        width: isNaN(width) ? 800 : width,
        height: isNaN(height) ? 600 : height
    };
}

function getOutputDimensions(svg: string, options?: GenerateOptions): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    const { width: fullWidth, height: fullHeight } = getSvgDimensions(doc);

    if (!options?.split) {
        return { width: fullWidth, height: fullHeight };
    }

    return {
        width: options.split.direction === 'vertical' ? fullWidth / 2 : fullWidth,
        height: options.split.direction === 'horizontal' ? fullHeight / 2 : fullHeight,
    };
}

function getRenderScale(options?: GenerateOptions): number {
    const baseScale = options?.quality === 1 ? 3 : 2;
    const multiplier = options?.renderScaleMultiplier ?? 1;

    return Math.max(0.1, baseScale * multiplier);
}

/**
 * Converts an SVG string to a Canvas element using native browser rendering.
 * Supports split cropping via options.
 *
 * IMPORTANT: Chrome blocks data: and blob: URLs inside SVG when loaded as <img> via blob URL.
 * To work around this, we strip out data:/blob: href images from the SVG before rendering,
 * draw the base SVG to canvas, then manually draw each extracted image on top at the
 * correct SVG coordinates.
 */
async function svgToCanvas(svg: string, options?: GenerateOptions): Promise<HTMLCanvasElement> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    const svgEl = doc.documentElement;
    if (!svgEl.getAttribute('xmlns')) {
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }

    const { width: fullWidth, height: fullHeight } = getSvgDimensions(doc);

    // High quality scaling (3x for print-ready quality if possible, otherwise 2x)
    const renderScale = getRenderScale(options);
    const canvasWidth = Math.max(1, Math.round(fullWidth * renderScale));
    const canvasHeight = Math.max(1, Math.round(fullHeight * renderScale));
    const scaleX = canvasWidth / fullWidth;
    const scaleY = canvasHeight / fullHeight;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = canvasWidth;
    fullCanvas.height = canvasHeight;

    const ctx = fullCanvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get canvas context');

    fullCanvas.style.width = `${fullWidth}px`;
    fullCanvas.style.height = `${fullHeight}px`;

    ctx.scale(scaleX, scaleY);

    // Fill with white background to prevent black transparency in JPEG/PDF
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, fullWidth, fullHeight);

    // Render SVG directly to canvas
    // Native browser rendering supports base64-encoded <image> tags perfectly,
    // which preserves opacity="0" and display="none" for <select> overlays.
    const serializer = new XMLSerializer();
    const processedSvg = serializer.serializeToString(doc);
    const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SVG rendering timeout')), 15000);
        img.onload = () => {
            clearTimeout(timeout);
            // Draw SVG over the white background (DO NOT use clearRect)
            ctx.drawImage(img, 0, 0, fullWidth, fullHeight);
            URL.revokeObjectURL(url);
            resolve(true);
        };
        img.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG for rendering'));
        };
        img.src = url;
    });

    if (options?.split) {
        const { direction, side } = options.split;
        const targetWidth = direction === 'vertical' ? fullWidth / 2 : fullWidth;
        const targetHeight = direction === 'horizontal' ? fullHeight / 2 : fullHeight;

        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = Math.max(1, Math.round(targetWidth * scaleX));
        targetCanvas.height = Math.max(1, Math.round(targetHeight * scaleY));

        const targetCtx = targetCanvas.getContext('2d');
        if (!targetCtx) throw new Error('Could not get target canvas context');

        let sx = 0, sy = 0;
        if (direction === 'vertical' && side === 'back') sx = Math.round((fullWidth / 2) * scaleX);
        if (direction === 'horizontal' && side === 'back') sy = Math.round((fullHeight / 2) * scaleY);

        targetCtx.drawImage(
            fullCanvas,
            sx, sy, targetCanvas.width, targetCanvas.height, // source
            0, 0, targetCanvas.width, targetCanvas.height    // destination
        );

        return targetCanvas;
    }

    return fullCanvas;
}

/**
 * Generates a PNG blob from SVG string
 */
export async function generatePng(svg: string, options?: GenerateOptions): Promise<Blob> {
    const canvas = await svgToCanvas(svg, options);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
    });
}

/**
 * Generates a PDF blob from SVG string
 */
export async function generatePdf(svg: string, options?: GenerateOptions): Promise<Blob> {
    const canvas = await svgToCanvas(svg, options);
    const jpegQuality = options?.jpegQuality ?? 0.95;
    const imgData = canvas.toDataURL('image/jpeg', jpegQuality);

    // Create PDF with target dimensions
    const { width, height } = getOutputDimensions(svg, options);

    const orientation = width > height ? 'l' : 'p';
    const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [width, height]
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
    return pdf.output('blob');
}

/**
 * Triggers a browser download
 */
export function triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Safari/iOS fixes
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    document.body.appendChild(link);
    link.click();

    // Small delay before cleanup for Safari/iOS
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 500); // Increased delay for slower mobile browsers
}
