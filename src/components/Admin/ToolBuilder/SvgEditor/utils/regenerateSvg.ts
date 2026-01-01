/**
 * Regenerate SVG from edited elements
 * Matches elements by ID/identity instead of index to preserve content during reordering
 */

import { applyWrappedText } from "@/lib/utils/textWrapping";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Create a unique identifier for an element to match edited elements with DOM elements
 */
function getElementKey(element: SvgElement): string {
  // Prefer originalId if available (handles renamed IDs)
  if (element.originalId) {
    return `id:${element.originalId}`;
  }
  
  // If originalId is not present, it means the element didn't have an ID originally.
  // We should NOT use element.id here because the original element won't have it.
  
  // For elements without ID, use tag + text content + key attributes
  const tag = element.tag;
  const text = element.innerText || '';
  const href = element.attributes.href || element.attributes['xlink:href'] || '';
  // Use a combination that's likely unique
  return `tag:${tag}|text:${text.substring(0, 50)}|href:${href.substring(0, 50)}`;
}

/**
 * Find matching DOM element for an edited element
 */
function findMatchingElement(
  editedEl: SvgElement,
  allOriginalElements: Element[]
): Element | null {
  // Build key for edited element
  const editedKey = getElementKey(editedEl);
  
  // Try to find exact match first
  for (const originalEl of allOriginalElements) {
    const originalId = originalEl.getAttribute('id');
    const originalTag = originalEl.tagName.toLowerCase();
    const originalText = originalEl.textContent?.trim().toLowerCase() || '';
    const originalHref = originalEl.getAttribute('href') || originalEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
    
    // Build key for original element
    let originalKey: string;
    if (originalId) {
      originalKey = `id:${originalId}`;
    } else {
      originalKey = `tag:${originalTag}|text:${originalText.substring(0, 50)}|href:${originalHref.substring(0, 50)}`;
    }
    
    if (originalKey === editedKey) {
      return originalEl;
    }
  }
  
  // If no exact match, try ID-only match (in case ID changed)
  if (editedEl.id) {
    for (const originalEl of allOriginalElements) {
      if (originalEl.getAttribute('id') === editedEl.id) {
        return originalEl;
      }
    }
  }
  
  return null;
}

/**
 * Regenerate SVG string from edited elements
 * Elements are matched by ID/identity, not index, so reordering doesn't change content
 */
export function regenerateSvg(
  currentSvg: string, 
  elements: SvgElement[], 
  highlightElement?: SvgElement | null
): string {
  try {
    // Parse the original SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const svg = doc.documentElement;
    
    // Get all editable elements from the original SVG (preserve order)
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
    
    // Create a map of edited elements by their key for fast lookup
    const editedElementsMap = new Map<string, SvgElement>();
    elements.forEach(editedEl => {
      editedElementsMap.set(getElementKey(editedEl), editedEl);
    });
    
    // Track which original elements have been updated
    const updatedElements = new Set<Element>();
    
    // Update elements in the order they appear in the edited elements array
    // This ensures the DOM order matches the reordered array
    const newOrder: Element[] = [];
    
    elements.forEach(editedEl => {
      const matchingOriginalEl = findMatchingElement(editedEl, allOriginalElements);
      
      if (matchingOriginalEl && !updatedElements.has(matchingOriginalEl)) {
        // Update the DOM element with edited values
        // Clear all existing attributes (including namespaced ones)
        const attrsToRemove: { name: string; namespaceURI: string | null }[] = [];
        Array.from(matchingOriginalEl.attributes).forEach(attr => {
          attrsToRemove.push({ name: attr.name, namespaceURI: attr.namespaceURI });
        });
        attrsToRemove.forEach(attr => {
          if (attr.namespaceURI) {
            matchingOriginalEl.removeAttributeNS(attr.namespaceURI, attr.name);
          } else {
            matchingOriginalEl.removeAttribute(attr.name);
          }
        });
        
        // Set all attributes from the edited element
        const hrefNS = 'http://www.w3.org/1999/xlink';
        Object.entries(editedEl.attributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            const stringValue = String(value);
            // Handle xlink:href namespace for image elements
            // The key might be stored as 'xlink:href' or 'href' in the attributes object
            if (editedEl.tag === 'image' && (key === 'href' || key === 'xlink:href')) {
              // Always use xlink namespace for image href
              matchingOriginalEl.setAttributeNS(hrefNS, 'href', stringValue);
            } else if (key.startsWith('xlink:') || key.startsWith('xmlns:')) {
              // Handle other namespaced attributes (preserve namespace)
              const parts = key.split(':');
              if (parts.length === 2) {
                const ns = key.startsWith('xmlns:') 
                  ? 'http://www.w3.org/2000/xmlns/'
                  : hrefNS;
                matchingOriginalEl.setAttributeNS(ns, parts[1], stringValue);
              }
            } else {
              // Regular attribute
              matchingOriginalEl.setAttribute(key, stringValue);
            }
          }
        });
        
        // Ensure the ID is set from editedEl.id
        if (editedEl.id) {
          matchingOriginalEl.setAttribute('id', editedEl.id);
        }
        
        // For image elements, ensure xlink:href is set if we have href in attributes
        if (editedEl.tag === 'image') {
          const hrefValue = editedEl.attributes.href || editedEl.attributes['xlink:href'];
          if (hrefValue && !matchingOriginalEl.getAttributeNS(hrefNS, 'href')) {
            matchingOriginalEl.setAttributeNS(hrefNS, 'href', hrefValue);
          }
        }
        
        // Update text content if applicable
        // Update text content with manual line break support
        if (typeof editedEl.innerText === 'string') {
          // Check for manual newlines in text elements
          if (matchingOriginalEl.tagName.toLowerCase() === 'text' && editedEl.innerText.includes('\n')) {
             // Improved font-size detection
             let fontSize = parseFloat(editedEl.attributes['font-size'] || '0');
             if (!fontSize) {
               // Try to parse from style
               const style = editedEl.attributes.style || '';
               const match = style.match(/font-size:\s*([\d.]+)/); // Capture number, ignore unit for now (assume px/pt are close enough or handle conversion)
               if (match) {
                 fontSize = parseFloat(match[1]);
                 // Simple heuristic: if pt, convert to px (roughly * 1.33)
                 if (style.match(/font-size:\s*[\d.]+pt/)) fontSize *= 1.33;
               } else {
                 fontSize = 16;
               }
             }
             
             // Use shared logic for wrapping (renders tspans)
             // MUST pass 'doc' because we are working with a detached DOMParser document, not window.document
             applyWrappedText(matchingOriginalEl, editedEl.innerText, fontSize, doc);
             
          } else {
             matchingOriginalEl.textContent = editedEl.innerText;
          }
        }

        // --- Apply Highlight if this is the selected element ---
        if (highlightElement && 
            (editedEl === highlightElement || 
             (editedEl.id && highlightElement.id && editedEl.id === highlightElement.id) ||
             editedEl === highlightElement // Fallback for reference check
            )) {
          const currentStyle = matchingOriginalEl.getAttribute("style") || "";
          // Green dashed outline for high visibility against most backgrounds
          matchingOriginalEl.setAttribute("style", `${currentStyle}; outline: 2px dashed #4ade80; outline-offset: 2px;`);
        }
        
        updatedElements.add(matchingOriginalEl);
        newOrder.push(matchingOriginalEl);
      }
    });
    
    // Reorder elements in DOM to match the new order
    if (newOrder.length > 0 && newOrder.length === elements.length) {
      // Get parent of first element (they should all have the same parent)
      const parent = newOrder[0].parentNode;
      if (parent) {
        // Remove all elements from DOM
        newOrder.forEach(el => el.remove());
        // Add them back in new order
        newOrder.forEach(el => parent.appendChild(el));
      }
    }

    return svg.outerHTML;
  } catch (error) {
    console.error('Error regenerating SVG:', error);
    return currentSvg;
  }
}

