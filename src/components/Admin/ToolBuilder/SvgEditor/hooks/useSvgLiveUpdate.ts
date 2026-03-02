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
  const prevStatesRef = useRef<Record<string, string>>({});
  const prevHighlightIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Handle Highlight changes efficiently
    if (prevHighlightIdRef.current !== highlightId) {
      if (prevHighlightIdRef.current) {
        try {
          const escapedId = CSS.escape(prevHighlightIdRef.current);
          const prevEl = containerRef.current.querySelector(`[data-internal-id="${escapedId}"]`);
          if (prevEl) {
            (prevEl as HTMLElement).style.outline = '';
            (prevEl as HTMLElement).style.outlineOffset = '';
          }
        } catch { /* ignore */ }
      }

      if (highlightId) {
        try {
          const escapedId = CSS.escape(highlightId);
          const highlightEl = containerRef.current.querySelector(`[data-internal-id="${escapedId}"]`);
          if (highlightEl) {
            (highlightEl as HTMLElement).style.outline = '2px dashed #4ade80';
            (highlightEl as HTMLElement).style.outlineOffset = '2px';
          }
        } catch { /* ignore */ }
      }
      prevHighlightIdRef.current = highlightId ?? null;
    }

    // 2. Surgical Element Updates
    // We only update what's changed. 
    // If we have an overrideElement, it's our top priority for fast updates.
    const elementsToProcess = overrideElement ? [overrideElement] : elements;

    elementsToProcess.forEach((activeElement) => {
      try {
        if (!activeElement.internalId) return;

        // Fast dirty check using stringification of relevant parts
        // This is much faster than full DOM diffing or React reconciliation
        const currentStateKey = JSON.stringify({
          attrs: activeElement.attributes,
          text: activeElement.innerText
        });

        if (prevStatesRef.current[activeElement.internalId] === currentStateKey) {
          return; // Skip if no change
        }

        const safeId = String(activeElement.internalId);
        const domEl = containerRef.current?.querySelector(`[data-internal-id="${CSS.escape(safeId)}"]`);
        if (!domEl) return;

        // Apply attributes surgically
        Object.entries(activeElement.attributes).forEach(([key, value]) => {
          if (value === undefined || value === null) return;

          if (value === "" && key !== 'innerText') {
            if (domEl.hasAttribute(key)) domEl.removeAttribute(key);
            return;
          }

          if (key === 'xlink:href' || (key === 'href' && activeElement.tag === 'image')) {
            if (domEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href') !== value) {
              domEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', value);
            }
          } else if (key.startsWith('xlink:')) {
            const parts = key.split(':');
            if (parts[1]) domEl.setAttributeNS('http://www.w3.org/1999/xlink', parts[1], value);
          } else if (domEl.getAttribute(key) !== value) {
            domEl.setAttribute(key, value);
          }
        });

        // Update text with wrapping support (expensive, so we check if text actually changed)
        if (activeElement.innerText !== undefined) {
          if (activeElement.tag === 'text') {
            // Only re-wrap if text or font-size changed
            const fSize = activeElement.attributes['font-size'] || '16';
            const wrapKey = `${activeElement.internalId}_wrap_${activeElement.innerText}_${fSize}`;
            if (prevStatesRef.current[activeElement.internalId + '_wrap'] !== wrapKey) {
              const fontSize = parseFloat(fSize);
              applyWrappedText(domEl as SVGTextElement, activeElement.innerText, fontSize);
              prevStatesRef.current[activeElement.internalId + '_wrap'] = wrapKey;
            }
          } else if (domEl.textContent !== activeElement.innerText) {
            domEl.textContent = activeElement.innerText;
          }
        }

        // Specifically handle style attribute to ensure it's synced
        const styleVal = activeElement.attributes.style || "";
        if (domEl.getAttribute('style') !== styleVal) {
          if (styleVal) domEl.setAttribute('style', styleVal);
          else domEl.removeAttribute('style');
        }

        prevStatesRef.current[activeElement.internalId] = currentStateKey;
      } catch (err) {
        console.warn('[useSvgLiveUpdate] Error updating element:', activeElement.internalId, err);
      }
    });

  }, [elements, highlightId, containerRef, overrideElement]);
}
