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
 * Measure actual font metrics (ascent and descent) for accurate line spacing.
 * Different fonts have different internal spacing, so we measure the actual bounding box.
 * 
 * @param fontSize Font size in pixels
 * @param fontFamily Font family name (e.g., 'Arial', 'Times New Roman')
 * @returns Object with ascent and descent in pixels
 */
export function getFontMetrics(fontSize: number, fontFamily: string = 'Arial'): { ascent: number; descent: number } {
  // Try to use canvas for accurate measurement
  if (typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        // Use 'Mg' - M has maximum ascent, g has maximum descent
        const metrics = ctx.measureText('Mg');
        
        // actualBoundingBoxAscent/Descent give us the actual font metrics
        if (metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent) {
          return {
            ascent: metrics.actualBoundingBoxAscent,
            descent: metrics.actualBoundingBoxDescent,
          };
        }
      }
    } catch (e) {
      // Fall through to default calculation
      console.warn('Failed to measure font metrics, using defaults:', e);
    }
  }
  
  // Fallback: Use typical font metrics ratios
  // Increased slightly to prevent overlap in non-browser environments
  return {
    ascent: fontSize * 0.9,
    descent: fontSize * 0.3,
  };
}

/**
 * Injects wrapped text into an SVG text element using tspan.
 * Supports manual newlines and font-aware line spacing.
 * 
 * @param el The target SVG text element
 * @param linesOrText The text content (string) or array of lines. If string, it will be split by newline.
 * @param fontSize Font size in pixels for line height calculation.
 * @param fontFamily Optional font family for accurate spacing. Defaults to 'Arial'.
 * @param doc Optional document context (for server-side/DOMParser usage). Defaults to window.document.
 */
export function applyWrappedText(
  el: SVGTextElement | Element, 
  linesOrText: string | string[], 
  fontSize: number = 16,
  fontFamily: string = 'Arial',
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
  
  // Check for saved line height ratio (calculated by Admin browser)
  // This ensures consistent spacing on server-side where canvas metrics might fail
  const savedRatio = parseFloat(el.getAttribute('data-lh-ratio') || '0');
  
  let lineHeight: number;
  
  if (savedRatio > 0) {
      lineHeight = fontSize * savedRatio;
  } else {
      // Calculate font-aware line height based on actual font metrics
      const metrics = getFontMetrics(fontSize, fontFamily);
      // Line height = ascent + descent + padding
      const padding = fontSize * 0.2;
      lineHeight = metrics.ascent + metrics.descent + padding;
  }

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

/**
 * Retrieves the computed font size and family for an SVG element.
 * It checks in order:
 * 1. Element attributes (font-size, font-family)
 * 2. Inline style attribute
 * 3. Class definitions in <style> tags within the document
 * 
 * @param el The SVG element to inspect
 * @param doc The document containing the element and style definitions
 * @returns Object with resolved fontSize and fontFamily
 */
export function getSvgElementStyle(el: Element, doc: Document) {
  let fontSize = parseFloat(el.getAttribute('font-size') || '0');
  let fontFamily = el.getAttribute('font-family') || '';

  // If attributes are missing, look in inline styles
  if (!fontSize || !fontFamily) {
    const style = el.getAttribute('style') || '';
    
    if (!fontSize) {
      const inlineSizeMatch = style.match(/font-size:\s*([\d.]+)/);
      if (inlineSizeMatch) fontSize = parseFloat(inlineSizeMatch[1]);
    }
    
    if (!fontFamily) {
      const inlineFamilyMatch = style.match(/font-family:\s*([^;]+)/);
      if (inlineFamilyMatch) fontFamily = inlineFamilyMatch[1].trim().replace(/['"]/g, '');
    }
  }

  // If still missing, check class definitions in <style> tags
  // This is crucial for SVGs that use classes for styling instead of attributes
  if ((!fontSize || !fontFamily) && el.hasAttribute('class')) {
    const className = el.getAttribute('class')!;
    const styleElements = doc.querySelectorAll('style');
    
    // Regex to find class definition block: .className { ... }
    // Handles multiple matches to find properties across different blocks
    // Note: Escaping for regex is important. Simple whitespace split for multi-class support.
    // This looks for ANY of the classes. Ideally we should respect hierarchy but this is an improvement.
    // For simplicity, we just check exact class match in selector or partial match.
    // Improvement: support compound selectors if needed, but simple class selector is 99% case.
    const classNames = className.split(/\s+/);
    
    styleElements.forEach(styleEl => {
      const content = styleEl.textContent || '';
      
      classNames.forEach(cls => {
          if (!cls) return;
          // Regex finds .cls { ... } or .cls, .other { ... }
          // Matches .cls followed by optional chars until {
          const regex = new RegExp(`\\.${cls}[^{]*{([^}]+)}`, 'g');
          let match;
          while ((match = regex.exec(content)) !== null) {
            const block = match[1];
            if (!fontSize) {
              const sizeMatch = block.match(/font-size:\s*([\d.]+)/);
              if (sizeMatch) fontSize = parseFloat(sizeMatch[1]);
            }
            if (!fontFamily) {
              const familyMatch = block.match(/font-family:\s*([^;]+)/);
              if (familyMatch) fontFamily = familyMatch[1].trim().replace(/['"]/g, '');
            }
          }
      });
    });
  }
  
  return { 
    fontSize: fontSize || 16, // Fallback default
    fontFamily: fontFamily || 'Arial' // Fallback default
  };
}
