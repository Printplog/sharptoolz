/**
 * Utility functions for SVG operations
 */

import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Escape CSS selector special characters
 * Rule: Always escape IDs before using in querySelector to handle special characters like . : etc.
 */
export function escapeCssSelector(id: string): string {
  // Escape special CSS selector characters
  return id.replace(new RegExp("([!\"#$%&'()*+,./:;<=>?@[\\]^`{|}~])", "g"), '\\$1');
}

/**
 * Get element from SVG by ID (safely handles special characters)
 */
export function getSvgElementById(svgContent: string, id: string): Element | null {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
  const escapedId = escapeCssSelector(id);
  return svgDoc.querySelector(`#${escapedId}`);
}

/**
 * Get current text content from SVG element by ID
 */
export function getSvgElementText(svgContent: string, id: string): string {
  const element = getSvgElementById(svgContent, id);
  return element?.textContent?.trim() || '';
}

/**
 * Check if element is an image element
 */
export function isImageElement(el: SvgElement): boolean {
  return el.tag === 'image' || (typeof el.attributes.href === 'string' && el.attributes.href.startsWith('data:image'));
}

/**
 * Check if element is a text element
 */
export function isTextElement(el: SvgElement): boolean {
  return ['text', 'tspan', 'textPath'].includes(el.tag);
}

/**
 * Filter out non-editable SVG elements
 */
export function filterEditableElements(elements: SvgElement[]): SvgElement[] {
  const nonEditableTags = [
    'defs', 'style', 'linearGradient', 'radialGradient',
    'pattern', 'clipPath', 'mask', 'filter',
    'feGaussianBlur', 'feOffset', 'feFlood',
    'feComposite', 'feMerge', 'feMergeNode'
  ];
  return elements.filter(el => !nonEditableTags.includes(el.tag));
}

