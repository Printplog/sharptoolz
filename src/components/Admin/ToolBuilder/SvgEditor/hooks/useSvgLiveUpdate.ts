import { applyTextMasks, clearTextMasks } from "@/lib/utils/svgTextMasks";
import { useLayoutEffect, useRef } from 'react';
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { applyWrappedText, readSvgText, getSvgElementStyle } from "@/lib/utils/textWrapping";

/**
 * Hook to imperatively update an SVG DOM based on edited elements.
 * This avoids full string regeneration and React re-renders for every keystroke.
 */
export function useSvgLiveUpdate(
  containerRef: React.RefObject<HTMLDivElement>,
  elements: SvgElement[],
  highlightId?: string | null,
  svgRevision?: string
) {
  const mountedSvgRef = useRef<string | undefined>(undefined);
  const prevRootRef = useRef<Element | null>(null);
  const prevStatesRef = useRef<Record<string, SvgElement>>({});
  const prevWrapRef = useRef<Record<string, string>>({});
  const prevHighlightIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Own the SVG subtree: React must not replace it during unrelated renders.
    if (svgRevision !== undefined && svgRevision !== mountedSvgRef.current) {
      containerRef.current.innerHTML = svgRevision;
      mountedSvgRef.current = svgRevision;
    }
    const svgRoot = containerRef.current.querySelector("svg");
    if (svgRoot !== prevRootRef.current) {
      prevStatesRef.current = {};
      prevWrapRef.current = {};
      prevHighlightIdRef.current = null;
      prevRootRef.current = svgRoot;
    }
    if (svgRoot) clearTextMasks(svgRoot);

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

    const elementsToProcess = elements;

    elementsToProcess.forEach((activeElement) => {
      try {
        if (!activeElement.internalId) return;

        // Store updates are immutable. Do not stringify embedded image data
        // just to detect changes (uploads can contain many megabytes).
        if (prevStatesRef.current[activeElement.internalId] === activeElement) return;

        const safeId = String(activeElement.internalId);
        const domEl = containerRef.current?.querySelector(`[data-internal-id="${CSS.escape(safeId)}"]`);
        if (!domEl) return;

        // Apply attributes surgically
        Object.entries(activeElement.attributes).forEach(([key, value]) => {
          if (activeElement.tag === 'image' && (key === 'href' || key === 'xlink:href')) return;
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

        if (activeElement.tag === 'image') {
          const href = activeElement.attributes.href ?? activeElement.attributes['xlink:href'];
          if (href !== undefined) {
            domEl.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
            domEl.removeAttribute('xlink:href');
            if (!href) domEl.removeAttribute('href');
            else if (domEl.getAttribute('href') !== href) domEl.setAttribute('href', href);
          }
        }

        if (activeElement.id !== undefined) domEl.setAttribute('id', activeElement.id);

        // Update text with wrapping support (expensive, so we check if text actually changed)
        if (activeElement.innerText !== undefined) {
          if (activeElement.tag === 'text') {
            // Only re-wrap if text or font-size changed
            const style = getSvgElementStyle(domEl, domEl.ownerDocument);
            const fSize = String(style.fontSize);
            const fFamily = style.fontFamily;
            const wrapKey = `${activeElement.internalId}_wrap_${activeElement.innerText}_${fSize}_${fFamily}`;
            if (prevWrapRef.current[activeElement.internalId + '_wrap'] !== wrapKey) {
              const fontSize = parseFloat(fSize);
              if (readSvgText(domEl) !== activeElement.innerText || prevWrapRef.current[activeElement.internalId + '_wrap']) {
                applyWrappedText(domEl as SVGTextElement, activeElement.innerText, fontSize, fFamily);
              }
              prevWrapRef.current[activeElement.internalId + '_wrap'] = wrapKey;
            }
          } else if (['tspan', 'textPath'].includes(activeElement.tag) && domEl.textContent !== activeElement.innerText) {
            domEl.textContent = activeElement.innerText;
          }
        }

        // Specifically handle style attribute to ensure it's synced
        const styleVal = activeElement.attributes.style || "";
        if (domEl.getAttribute('style') !== styleVal) {
          if (styleVal) domEl.setAttribute('style', styleVal);
          else domEl.removeAttribute('style');
        }

        prevStatesRef.current[activeElement.internalId] = activeElement;
      } catch (err) {
        console.warn('[useSvgLiveUpdate] Error updating element:', activeElement.internalId, err);
      }
    });

    if (svgRoot) {
      try { applyTextMasks(svgRoot); }
      catch (error) { clearTextMasks(svgRoot); console.warn("Text mask preview:", error); }
    }
  }, [elements, highlightId, containerRef, svgRevision]);
}
