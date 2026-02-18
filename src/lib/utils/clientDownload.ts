import { jsPDF } from 'jspdf';
import { Canvg } from 'canvg';

/**
 * Utility for client-side document generation
 */

interface GenerateOptions {
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
    return (
        navigator.userAgent.includes('Opera Mini') ||
        (window as any).operamini !== undefined
    );
}

/**
 * Modifies SVG viewBox to create a split (half) view
 */
function splitSvg(svgDoc: Document, direction: 'horizontal' | 'vertical', side: 'front' | 'back'): { width: number, height: number } {
    const svgEl = svgDoc.documentElement;
    const originalWidth = parseInt(svgEl.getAttribute('width') || '800');
    const originalHeight = parseInt(svgEl.getAttribute('height') || '600');

    // If no viewBox, set one based on original dimensions
    let viewBoxStr = svgEl.getAttribute('viewBox');
    if (!viewBoxStr) {
        viewBoxStr = `0 0 ${originalWidth} ${originalHeight}`;
        svgEl.setAttribute('viewBox', viewBoxStr);
    }

    const [vx, vy, vw, vh] = viewBoxStr.split(' ').map(Number);
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (direction === 'horizontal') {
        const halfVh = vh / 2;
        newHeight = originalHeight / 2;
        if (side === 'front') {
            svgEl.setAttribute('viewBox', `${vx} ${vy} ${vw} ${halfVh}`);
        } else {
            svgEl.setAttribute('viewBox', `${vx} ${vy + halfVh} ${vw} ${halfVh}`);
        }
    } else {
        const halfVw = vw / 2;
        newWidth = originalWidth / 2;
        if (side === 'front') {
            svgEl.setAttribute('viewBox', `${vx} ${vy} ${halfVw} ${vh}`);
        } else {
            svgEl.setAttribute('viewBox', `${vx + halfVw} ${vy} ${halfVw} ${vh}`);
        }
    }

    svgEl.setAttribute('width', newWidth.toString());
    svgEl.setAttribute('height', newHeight.toString());

    return { width: newWidth, height: newHeight };
}

/**
 * Converts an SVG string to a Canvas element
 */
async function svgToCanvas(svg: string, options?: GenerateOptions): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Parse SVG to get dimensions
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    let width, height;
    if (options?.split) {
        const dims = splitSvg(doc, options.split.direction, options.split.side);
        width = dims.width;
        height = dims.height;
    } else {
        const svgEl = doc.documentElement;
        width = parseInt(svgEl.getAttribute('width') || '800');
        height = parseInt(svgEl.getAttribute('height') || '600');
    }

    // Set canvas size (increase for better quality)
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;

    const serializer = new XMLSerializer();
    const processedSvg = serializer.serializeToString(doc);

    const v = await Canvg.from(ctx, processedSvg);
    await v.render();

    return canvas;
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

    // Get dimensions for PDF aspect ratio
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    let width, height;
    if (options?.split) {
        const dims = splitSvg(doc, options.split.direction, options.split.side);
        width = dims.width;
        height = dims.height;
    } else {
        const svgEl = doc.documentElement;
        width = parseInt(svgEl.getAttribute('width') || '800');
        height = parseInt(svgEl.getAttribute('height') || '600');
    }

    // Create PDF (orientation based on dimensions)
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

    // Small delay before cleanup for Safari
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }, 100);
}
