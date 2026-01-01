/**
 * Utility to wrap text for SVG elements using tspan.
 */

export interface WrapOptions {
  maxWidth: number;
  fontSize: number;
  fontFamily: string;
}

/**
 * Wraps text into multiple lines based on a maximum width.
 * Uses a heuristic based on character width if a measurement canvas isn't provided.
 */
// Reusable canvas for text measurement
let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext() {
  if (!measureCtx && typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d');
  }
  return measureCtx;
}

/**
 * Wraps text into multiple lines based on a maximum width.
 * Uses Canvas 2D API for accurate text measurement.
 */
export function wrapSvgText(text: string, options: WrapOptions): string[] {
  if (!text || options.maxWidth <= 0) return [text];

  const ctx = getMeasureContext();
  // Fallback to heuristic if no canvas (e.g. server-side)
  if (!ctx) {
     const charWidthRatio = 0.6; 
     const getApproxWidth = (str: string) => str.length * options.fontSize * charWidthRatio;
     
     const words = text.split(/\s+/);
     const lines: string[] = [];
     let currentLine = "";

     for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (getApproxWidth(testLine) > options.maxWidth && currentLine !== "") {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
     }
     if (currentLine) lines.push(currentLine);
     return lines;
  }

  // Use Canvas measurement
  ctx.font = `${options.fontSize}px ${options.fontFamily || 'Arial'}`;
  
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > options.maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  lines.push(currentLine);
  return lines;
}

/**
 * Injects wrapped text into an SVG text element using tspan.
 */
/**
 * Injects wrapped text into an SVG text element using tspan.
 * Supports manual newlines and pixel-perfect line spacing.
 * @param el The target SVG text element
 * @param linesOrText The text content (string) or array of lines. If string, it will be split by newline.
 * @param fontSize Font size in pixels for line height calculation.
 * @param doc Optional document context (for server-side/DOMParser usage). Defaults to window.document.
 */
export function applyWrappedText(
  el: SVGTextElement | Element, 
  linesOrText: string | string[], 
  fontSize: number = 16,
  doc: Document = document
) {
  // Normalize input to array of lines
  const lines = Array.isArray(linesOrText) 
    ? linesOrText 
    : (linesOrText || "").split('\n');

  // Clear existing content
  el.textContent = "";

  // Get original coordinates
  const x = el.getAttribute("x") || "0";
  
  // Calculate line height using a multiplier for consistent spacing across resolutions.
  // 1.5 gives a ~0.5em gap (approx 8px for 16px font), scaling with the document.
  const lineHeight = fontSize * 1.5;

  lines.forEach((line, i) => {
    const tspan = doc.createElementNS("http://www.w3.org/2000/svg", "tspan");
    // Use non-breaking space for empty lines to ensure they occupy vertical space
    tspan.textContent = line || "\u00A0";
    
    // x must be set on every tspan to align correctly
    tspan.setAttribute("x", x);
    
    // For subsequent lines, add dy
    if (i > 0) {
      // Use unitless value for dy to ensure it uses the local coordinate system (User Units)
      tspan.setAttribute("dy", String(lineHeight));
    } else {
       // First line needs no dy usually, or could reset if needed 
    }
    
    el.appendChild(tspan);
  });
}
