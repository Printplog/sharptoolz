import { jsPDF } from 'jspdf';

/**
 * Utility for client-side document generation
 */

export interface GenerateOptions {
    filename?: string;
    quality?: number;
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

/**
 * Converts an SVG string to a Canvas element using native browser rendering.
 * Supports split cropping via options.
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
    const scale = options?.quality === 1 ? 3 : 2;

    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = fullWidth * scale;
    fullCanvas.height = fullHeight * scale;

    const ctx = fullCanvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('Could not get canvas context');

    // SAFARI/MOBILE FIX: Set style dimensions explicitly for consistent rendering
    fullCanvas.style.width = `${fullWidth}px`;
    fullCanvas.style.height = `${fullHeight}px`;

    ctx.scale(scale, scale);

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
            ctx.clearRect(0, 0, fullWidth, fullHeight);
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
        targetCanvas.width = targetWidth * scale;
        targetCanvas.height = targetHeight * scale;

        const targetCtx = targetCanvas.getContext('2d');
        if (!targetCtx) throw new Error('Could not get target canvas context');

        let sx = 0, sy = 0;
        if (direction === 'vertical' && side === 'back') sx = (fullWidth / 2) * scale;
        if (direction === 'horizontal' && side === 'back') sy = (fullHeight / 2) * scale;

        targetCtx.drawImage(
            fullCanvas,
            sx, sy, targetWidth * scale, targetHeight * scale, // source
            0, 0, targetWidth * scale, targetHeight * scale    // destination
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
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create PDF with target dimensions
    const width = canvas.width / 2; // back to original units (ignoring 2x scale)
    const height = canvas.height / 2;

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
