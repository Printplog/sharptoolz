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
export function wrapSvgText(text: string, options: WrapOptions): string[] {
  if (!text || options.maxWidth <= 0) return [text];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  // Rough heuristic: average character is about 0.6 of font size in width
  // This varies by font but works well as a default for most sans-serif fonts.
  const charWidthRatio = 0.55; 
  const getWidth = (str: string) => str.length * options.fontSize * charWidthRatio;

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (getWidth(testLine) > options.maxWidth && currentLine !== "") {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Injects wrapped text into an SVG text element using tspan.
 */
export function applyWrappedText(el: SVGTextElement, lines: string[]) {
  // Clear existing content
  el.textContent = "";

  // Get original coordinates
  const x = el.getAttribute("x") || "0";
  
  lines.forEach((line, i) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.textContent = line;
    tspan.setAttribute("x", x);
    // dy="1.2em" usually gives a good line height
    if (i > 0) {
      tspan.setAttribute("dy", "1.2em");
    }
    el.appendChild(tspan);
  });
}
