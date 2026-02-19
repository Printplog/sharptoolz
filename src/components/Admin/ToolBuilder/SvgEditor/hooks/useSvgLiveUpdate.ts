import { useEffect, useRef } from 'react';
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { applyWrappedText } from "@/lib/utils/textWrapping";

/**
 * Hook to imperatively update an SVG DOM based on edited elements.
 * This avoids full string regeneration and React re-renders for every keystroke.
 */
export function useSvgLiveUpdate(
  containerRef: React.RefObject<HTMLDivElement>,
  elements: SvgElement[],
  highlightId?: string | null,
  overrideElement?: SvgElement | null
) {
  const prevHighlightIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Clear previous highlight
    if (prevHighlightIdRef.current && prevHighlightIdRef.current !== highlightId) {
      try {
        const prevEl = containerRef.current.querySelector(`[data-internal-id="${CSS.escape(prevHighlightIdRef.current)}"]`);
        if (prevEl) {
          (prevEl as HTMLElement).style.outline = '';
          (prevEl as HTMLElement).style.outlineOffset = '';
        }
      } catch { /* ignore */ }
    }

    // 2. Update ONLY the active element
    // highlightId is the internalId in the new store
    const activeElement = (overrideElement && overrideElement.internalId === highlightId)
      ? overrideElement
      : (highlightId ? elements.find(e => e.internalId === highlightId) : null);

    if (activeElement && highlightId) {
      try {
        const domEl = containerRef.current.querySelector(`[data-internal-id="${CSS.escape(highlightId)}"]`);
        if (domEl) {
          // Apply attributes
          Object.entries(activeElement.attributes).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (key === 'xlink:href' || (key === 'href' && activeElement.tag === 'image')) {
              domEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
            } else if (key.startsWith('xlink:')) {
              const parts = key.split(':');
              if (parts[1]) domEl.setAttributeNS('http://www.w3.org/1999/xlink', parts[1], value);
            } else {
              domEl.setAttribute(key, value);
            }
          });

          // Update text with wrapping support
          if (activeElement.innerText !== undefined) {
            if (activeElement.tag === 'text') {
              const fontSize = parseFloat(activeElement.attributes['font-size'] || window.getComputedStyle(domEl).fontSize || '16');
              applyWrappedText(domEl as SVGTextElement, activeElement.innerText, fontSize);
            } else if (domEl.textContent !== activeElement.innerText) {
              domEl.textContent = activeElement.innerText;
            }
          }

          // Update style
          if (activeElement.attributes.style) {
            domEl.setAttribute('style', activeElement.attributes.style);
          }
        }
      } catch { /* ignore */ }
    }

    // 3. Apply New Highlight
    if (highlightId) {
      try {
        const highlightEl = containerRef.current.querySelector(`[data-internal-id="${CSS.escape(highlightId)}"]`);
        if (highlightEl) {
          (highlightEl as HTMLElement).style.outline = '2px dashed #4ade80';
          (highlightEl as HTMLElement).style.outlineOffset = '2px';
        }
      } catch { /* ignore */ }
      prevHighlightIdRef.current = highlightId;
    } else {
      prevHighlightIdRef.current = null;
    }

  }, [elements, highlightId, containerRef, overrideElement]);
}
