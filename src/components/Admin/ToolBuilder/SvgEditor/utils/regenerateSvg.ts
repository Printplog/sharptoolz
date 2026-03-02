/**
 * Regenerate SVG from edited elements
 * Matches elements by ID/identity instead of index to preserve content during reordering
 */

import { applyWrappedText } from "@/lib/utils/textWrapping";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

export interface RegenerateOptions {
  highlightElementId?: string | null;
  keepInternalIds?: boolean;
}

/**
 * Regenerate SVG string from edited elements
 */
export function regenerateSvg(
  currentSvg: string,
  elements: SvgElement[],
  options: RegenerateOptions = {}
): string {
  const { highlightElementId, keepInternalIds = false } = options;
  if (!currentSvg) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentSvg, 'image/svg+xml');
    const svg = doc.documentElement;

    const ns = "http://www.w3.org/2000/svg";
    const hrefNS = 'http://www.w3.org/1999/xlink';

    const storeElementsMap = new Map(elements.map(el => [el.internalId, el]));
    const foundInternalIds = new Set<string>();

    // 1. Update existing elements in place
    const allDomElements = Array.from(doc.querySelectorAll("[data-internal-id]"));
    allDomElements.forEach(el => {
      const internalId = el.getAttribute('data-internal-id');
      if (!internalId) return;

      if (!storeElementsMap.has(internalId)) {
        // Element was deleted from store, remove from DOM
        el.remove();
      } else {
        // Element exists, update its attributes and content
        const editedEl = storeElementsMap.get(internalId)!;
        foundInternalIds.add(internalId);

        // Clear attributes (except the ID we need to find it again)
        const attrsToRemove = Array.from(el.attributes).filter(a => a.name !== 'data-internal-id');
        attrsToRemove.forEach(attr => {
          if (attr.namespaceURI) el.removeAttributeNS(attr.namespaceURI, attr.name);
          else el.removeAttribute(attr.name);
        });

        // Set all attributes from the edited element
        Object.entries(editedEl.attributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const stringValue = String(value);

            // If the value is an empty string, we should remove the attribute
            // (e.g. if we set transform: "" to clear it)
            if (stringValue === "" && key !== 'innerText') {
              el.removeAttribute(key);
              return;
            }

            if (editedEl.tag === 'image' && (key === 'href' || key === 'xlink:href')) {
              el.setAttributeNS(hrefNS, 'href', stringValue);
            } else if (key.startsWith('xlink:') || key.startsWith('xmlns:')) {
              const parts = key.split(':');
              if (parts.length === 2) {
                const prefix = key.startsWith('xmlns:') ? 'http://www.w3.org/2000/xmlns/' : hrefNS;
                el.setAttributeNS(prefix, parts[1], stringValue);
              }
            } else {
              el.setAttribute(key, stringValue);
            }
          }
        });

        if (editedEl.id) el.setAttribute('id', editedEl.id);
        const currentInternalId = String(editedEl.internalId || '');
        if (keepInternalIds && currentInternalId) el.setAttribute('data-internal-id', currentInternalId);

        // Apply text content
        if (typeof editedEl.innerText === 'string') {
          if (editedEl.tag === 'text') {
            const fontSizeAttr = editedEl.attributes['font-size'];
            const fontSize = fontSizeAttr ? parseFloat(fontSizeAttr) : 16;
            const fontFamily = editedEl.attributes['font-family'] || 'Arial';
            applyWrappedText(el as SVGTextElement, editedEl.innerText, fontSize, fontFamily, doc);
          } else {
            el.textContent = editedEl.innerText;
          }
        } else {
          el.textContent = ''; // Clear text content if it's no longer a string
        }

        // Apply highlight
        if (highlightElementId && editedEl.internalId === highlightElementId) {
          const currentStyle = el.getAttribute("style") || "";
          el.setAttribute("style", `${currentStyle}; outline: 2px dashed #4ade80; outline-offset: 4px;`);
        } else {
          // Remove highlight if it was previously highlighted but no longer should be
          const currentStyle = el.getAttribute("style") || "";
          if (currentStyle.includes('outline:')) {
            el.setAttribute("style", currentStyle.replace(/outline: [^;]+; ?outline-offset: [^;]+;?/g, '').trim());
          }
        }
      }
    });

    // 2. Add new elements that were NOT in the original DOM (e.g. duplicates or newly added)
    elements.forEach(editedEl => {
      const eId = editedEl.internalId || "";
      if (foundInternalIds.has(eId)) return;

      try {
        const domEl = doc.createElementNS(ns, editedEl.tag);

        // Apply attributes... (same logic as above)
        Object.entries(editedEl.attributes).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            const stringValue = String(value);
            if (editedEl.tag === 'image' && (key === 'href' || key === 'xlink:href')) {
              domEl.setAttributeNS(hrefNS, 'href', stringValue);
            } else if (key.startsWith('xlink:') || key.startsWith('xmlns:')) {
              const parts = key.split(':');
              if (parts.length === 2) {
                const prefix = key.startsWith('xmlns:') ? 'http://www.w3.org/2000/xmlns/' : hrefNS;
                domEl.setAttributeNS(prefix, parts[1], stringValue);
              }
            } else {
              domEl.setAttribute(key, stringValue);
            }
          }
        });

        if (editedEl.id) domEl.setAttribute('id', editedEl.id);
        const newInternalIdVal = editedEl.internalId || "";
        if (keepInternalIds && newInternalIdVal) domEl.setAttribute('data-internal-id', newInternalIdVal);

        if (typeof editedEl.innerText === 'string') {
          if (editedEl.tag === 'text') {
            const fSizeAttr = editedEl.attributes['font-size'];
            const fSize = fSizeAttr ? parseFloat(fSizeAttr) : 16;
            const fFamily = editedEl.attributes['font-family'] || 'Arial';
            applyWrappedText(domEl as SVGTextElement, editedEl.innerText, fSize, fFamily, doc);
          } else {
            domEl.textContent = editedEl.innerText;
          }
        }

        // Apply visual highlight if requested for new elements
        if (highlightElementId && editedEl.internalId === highlightElementId) {
          const currentStyle = domEl.getAttribute("style") || "";
          domEl.setAttribute("style", `${currentStyle}; outline: 2px dashed #4ade80; outline-offset: 4px;`);
        }

        svg.appendChild(domEl); // Append to root for now
      } catch (err) {
        console.error(`Error adding new element ${eId}:`, err);
      }
    });

    // 3. Handle structure cleaning (optional)
    if (!keepInternalIds) {
      doc.querySelectorAll('[data-internal-id]').forEach(el => el.removeAttribute('data-internal-id'));
    }

    return svg.outerHTML;
  } catch (error) {
    console.error('Error regenerating SVG:', error);
    return currentSvg;
  }
}
