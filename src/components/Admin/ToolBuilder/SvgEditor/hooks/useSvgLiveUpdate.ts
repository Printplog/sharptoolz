import { useEffect, useRef } from 'react';
import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Hook to imperatively update an SVG DOM based on edited elements.
 * This avoids full string regeneration and React re-renders for every keystroke.
 */
export function useSvgLiveUpdate(
  containerRef: React.RefObject<HTMLDivElement>,
  elements: SvgElement[],
  highlightId?: string | null
) {
  // Track previous highlight to clear it efficiently without scanning the whole tree
  const prevHighlightIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // 1. Clear previous highlight
    if (prevHighlightIdRef.current && prevHighlightIdRef.current !== highlightId) {
      try {
        const prevEl = containerRef.current.querySelector(`[id="${CSS.escape(prevHighlightIdRef.current)}"]`);
        if (prevEl) {
          (prevEl as HTMLElement).style.outline = '';
          (prevEl as HTMLElement).style.outlineOffset = '';
        }
      } catch (e) { /* ignore invalid selector */ }
    }

    // 2. Update ONLY the active element
    const activeElement = highlightId ? elements.find(e => e.id === highlightId) : null;
    
    if (activeElement) {
      try {
        const domEl = containerRef.current.querySelector(`[id="${CSS.escape(activeElement.id!)}"]`);
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

          // Update text
          if (activeElement.innerText !== undefined && domEl.textContent !== activeElement.innerText) {
            domEl.textContent = activeElement.innerText;
          }

          // Update style
          if (activeElement.attributes.style) {
            domEl.setAttribute('style', activeElement.attributes.style);
          }
        }
      } catch (e) { /* ignore */ }
    }

    // 3. Apply New Highlight
    if (highlightId) {
      try {
        const highlightEl = containerRef.current.querySelector(`[id="${CSS.escape(highlightId)}"]`);
        if (highlightEl) {
          (highlightEl as HTMLElement).style.outline = '2px dashed #4ade80';
          (highlightEl as HTMLElement).style.outlineOffset = '2px';
        }
      } catch (e) { /* ignore */ }
      prevHighlightIdRef.current = highlightId;
    } else {
      prevHighlightIdRef.current = null;
    }

  }, [elements, highlightId, containerRef]);
}
