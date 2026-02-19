/**
 * Regenerate SVG from edited elements
 * Matches elements by ID/identity instead of index to preserve content during reordering
 */

import { applyWrappedText, getSvgElementStyle } from "@/lib/utils/textWrapping";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Find matching DOM element for an edited element
 */
function findMatchingElement(
  editedEl: SvgElement,
  doc: Document
): Element | null {
  const internalId = editedEl.internalId;
  if (internalId) {
    return doc.querySelector(`[data-internal-id="${CSS.escape(internalId)}"]`);
  }

  // Fallback for elements without internalId (should not happen with new store)
  if (editedEl.id) {
    return doc.querySelector(`[id="${CSS.escape(editedEl.id)}"]`);
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
  highlightElementId?: string | null
): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const svg = doc.documentElement;

    // Track which original elements have been updated
    const updatedElements = new Set<Element>();
    const newOrder: Element[] = [];

    elements.forEach(editedEl => {
      const matchingOriginalEl = findMatchingElement(editedEl, doc);

      if (matchingOriginalEl && !updatedElements.has(matchingOriginalEl)) {
        // Clear all existing attributes except data-internal-id (we'll remove that at the end)
        const attrsToRemove = Array.from(matchingOriginalEl.attributes)
          .filter(a => a.name !== 'data-internal-id');

        attrsToRemove.forEach(attr => {
          if (attr.namespaceURI) matchingOriginalEl.removeAttributeNS(attr.namespaceURI, attr.name);
          else matchingOriginalEl.removeAttribute(attr.name);
        });

        // Set all attributes from the edited element
        const hrefNS = 'http://www.w3.org/1999/xlink';
        Object.entries(editedEl.attributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (editedEl.tag === 'image' && (key === 'href' || key === 'xlink:href')) {
              matchingOriginalEl.setAttributeNS(hrefNS, 'href', String(value));
            } else if (key.startsWith('xlink:') || key.startsWith('xmlns:')) {
              const parts = key.split(':');
              if (parts.length === 2) {
                const ns = key.startsWith('xmlns:') ? 'http://www.w3.org/2000/xmlns/' : hrefNS;
                matchingOriginalEl.setAttributeNS(ns, parts[1], String(value));
              }
            } else {
              matchingOriginalEl.setAttribute(key, String(value));
            }
          }
        });

        if (editedEl.id) matchingOriginalEl.setAttribute('id', editedEl.id);

        if (typeof editedEl.innerText === 'string') {
          if (matchingOriginalEl.tagName.toLowerCase() === 'text' && editedEl.innerText.includes('\n')) {
            const { fontSize, fontFamily } = getSvgElementStyle(matchingOriginalEl, doc);
            applyWrappedText(matchingOriginalEl, editedEl.innerText, fontSize, fontFamily, doc);
          } else {
            matchingOriginalEl.textContent = editedEl.innerText;
          }
        }

        // Apply Highlight
        if (highlightElementId && editedEl.internalId === highlightElementId) {
          const currentStyle = matchingOriginalEl.getAttribute("style") || "";
          matchingOriginalEl.setAttribute("style", `${currentStyle}; outline: 2px dashed #4ade80; outline-offset: 2px;`);
        }

        updatedElements.add(matchingOriginalEl);
        newOrder.push(matchingOriginalEl);
      }
    });

    // Reorder elements in DOM to match the new order
    if (newOrder.length > 0) {
      const parent = newOrder[0].parentNode;
      if (parent) {
        newOrder.forEach(el => el.remove());
        newOrder.forEach(el => parent.appendChild(el));
      }
    }

    // Clean up internal IDs before returning
    doc.querySelectorAll('[data-internal-id]').forEach(el => el.removeAttribute('data-internal-id'));

    return svg.outerHTML;
  } catch (error) {
    console.error('Error regenerating SVG:', error);
    return currentSvg;
  }
}
