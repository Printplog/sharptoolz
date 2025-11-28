/**
 * Regenerate SVG from edited elements
 */

import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Regenerate SVG string from edited elements
 */
export function regenerateSvg(currentSvg: string, elements: SvgElement[]): string {
  try {
    // Parse the original SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const svg = doc.documentElement;
    
    // Get all editable elements from the original SVG
    const allOriginalElements = Array.from(svg.querySelectorAll('*')).filter(el => {
      const tag = el.tagName.toLowerCase();
      const nonEditableTags = [
        'defs', 'style', 'linearGradient', 'radialGradient', 
        'pattern', 'clipPath', 'mask', 'filter', 
        'feGaussianBlur', 'feOffset', 'feFlood', 
        'feComposite', 'feMerge', 'feMergeNode'
      ];
      return !nonEditableTags.includes(tag);
    });
    
    // Update each element with its edited version
    elements.forEach((editedEl, index) => {
      if (index < allOriginalElements.length) {
        const originalEl = allOriginalElements[index];
        
        // Update ALL attributes from the edited element
        // First, clear all existing attributes
        while (originalEl.attributes.length > 0) {
          originalEl.removeAttribute(originalEl.attributes[0].name);
        }
        
        // Then set all attributes from the edited element
        Object.entries(editedEl.attributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            originalEl.setAttribute(key, value);
          }
        });
        
        // Ensure the ID is set from editedEl.id
        if (editedEl.id) {
          originalEl.setAttribute('id', editedEl.id);
        }
        
        // Update text content if applicable
        if (typeof editedEl.innerText === 'string') {
          originalEl.textContent = editedEl.innerText;
        }
      }
    });

    return svg.outerHTML;
  } catch (error) {
    console.error('Error regenerating SVG:', error);
    return currentSvg;
  }
}

