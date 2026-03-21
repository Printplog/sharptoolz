import { extractFromDependency } from "./fieldExtractor";
import { applyWrappedText, getSvgElementStyle } from "./textWrapping";
import type { FormField } from "@/types";

export default function updateSvgFromFormData(svgSource: string, fields: FormField[]): string;
export default function updateSvgFromFormData(svgSource: Document, fields: FormField[]): Document;
export default function updateSvgFromFormData(svgSource: string | Document, fields: FormField[]): string | Document {
  if (!svgSource) return "";

  let doc: Document;
  const isDocument = svgSource instanceof Document;

  if (isDocument) {
    doc = svgSource;
  } else {
    const parser = new DOMParser();
    doc = parser.parseFromString(svgSource as string, "image/svg+xml");
  }

  // Pre-calculate field map for quick lookup (needed for dependency inheritance)
  const fieldsMap = new Map<string, FormField>();
  fields.forEach(f => fieldsMap.set(f.id, f));

  // Pre-compute once — reused by all fields with dependsOn (avoids O(n²) rebuilding)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFieldValues: Record<string, string | number | boolean | unknown> = {};
  fields.forEach((f) => {
    if (f.type === "select" && f.options && f.options.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selected = f.options.find((opt: any) => String(opt.value) === String(f.currentValue));
      allFieldValues[f.id] = selected?.displayText ?? selected?.label ?? f.currentValue ?? "";
    } else {
      allFieldValues[f.id] = f.currentValue ?? "";
    }
  });

  // Per-call cache — each unique ID is only queried once per updateSvgFromFormData invocation
  const findCache = new Map<string, SVGElement[]>();

  // Helper to find all elements by ID or internal ID
  const findElements = (id: string): SVGElement[] => {
    if (!id) return [];
    if (findCache.has(id)) return findCache.get(id)!;

    const results: Element[] = [];

    // 1. Check getElementById
    const byId = doc.getElementById(id);
    if (byId) results.push(byId);

    // 2. Check various selectors for multiple matches
    const selectors = [
      `[data-internal-id="${CSS.escape(id)}"]`,
      `[name="${CSS.escape(id)}"]`,
      `[data-name="${CSS.escape(id)}"]`,
      `[id="${CSS.escape(id)}"]` // Case where id might not be unique but querySelectorAll can find others
    ];

    selectors.forEach(selector => {
      try {
        const items = Array.from(doc.querySelectorAll(selector));
        results.push(...items);
      } catch { /* ignore invalid selectors */ }
    });

    // 3. Fallback: Prefix matching for DSL-augmented IDs
    // We match [id^="baseId."] to find elements with extensions (e.g. Field.text.track_123)
    // but we EXCLUDE helper elements like .error or .helper to prevent accidental transforms.
    if (results.length === 0) {
      const prefixSelector = `[id^="${CSS.escape(id)}."]`;
      try {
        const items = Array.from(doc.querySelectorAll(prefixSelector)).filter(el => {
          const elId = el.getAttribute("id") || "";
          return !elId.endsWith(".error") && !elId.endsWith(".helper") && !elId.includes(".error.") && !elId.includes(".helper.");
        });
        results.push(...items);
      } catch { /* ignore */ }
    }

    // Filter duplicates, cache, and return as SVGElement array
    const deduped = Array.from(new Set(results)) as SVGElement[];
    findCache.set(id, deduped);
    return deduped;
  };

  /*
   * Helper to consolidate transforms from both 'style' and 'transform' attribute.
   */
  const getElementCenter = (el: SVGElement) => {
    // 1. Try to extract existing pivot from the transform attribute as ground truth
    const transform = el.getAttribute("transform") || "";
    // Matches rotate(angle) or rotate(angle, cx, cy) or rotate(angle cx cy) with optional commas
    const rotateMatch = transform.match(/rotate\s*\(\s*(-?[\d.]+)\s*(?:[ ,]\s*(-?[\d.]+)\s*[ ,]\s*(-?[\d.]+)\s*)?\)/);
    
    if (rotateMatch && rotateMatch[2] && rotateMatch[3]) {
      const cx = parseFloat(rotateMatch[2]);
      const cy = parseFloat(rotateMatch[3]);
      if (!isNaN(cx) && !isNaN(cy)) return { cx, cy };
    }

    // 2. Element Specific Coordinates
    const tagName = el.tagName.toLowerCase();
    
    // Circle/Ellipse use cx/cy directly
    if (tagName === 'circle' || tagName === 'ellipse') {
       const cx = parseFloat(el.getAttribute("cx") || "0");
       const cy = parseFloat(el.getAttribute("cy") || "0");
       if (!isNaN(cx) && !isNaN(cy)) return { cx, cy };
    }

    // 3. Fallback: Calculate from dimensions (checking both attributes and style)
    const xAttr = el.getAttribute("x") || el.getAttribute("cx") || "0";
    const yAttr = el.getAttribute("y") || el.getAttribute("cy") || "0";
    let wAttr = el.getAttribute("width") || "";
    let hAttr = el.getAttribute("height") || "";

    // If attributes are missing or zero, try reading from style
    if (!wAttr || parseFloat(wAttr) <= 0) {
      const styleW = el.style.width || (el.getAttribute("style") || "").match(/width:\s*([\d.]+)px/)?.[1];
      if (styleW) wAttr = styleW;
    }
    if (!hAttr || parseFloat(hAttr) <= 0) {
      const styleH = el.style.height || (el.getAttribute("style") || "").match(/height:\s*([\d.]+)px/)?.[1];
      if (styleH) hAttr = styleH;
    }

    const x = parseFloat(xAttr);
    const y = parseFloat(yAttr);
    const w = parseFloat(wAttr);
    const h = parseFloat(hAttr);

    if (!isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return { cx: x + w / 2, cy: y + h / 2 };
    }

    // 4. For text elements, pivot is often (x, y)
    if (tagName === 'text' && !isNaN(x) && !isNaN(y)) {
      return { cx: x, cy: y };
    }

    // 5. Hard Fallback: Check for existing translation in transform
    const translateMatch = transform.match(/translate\(\s*(-?[\d.]+)\s*[ ,]\s*(-?[\d.]+)\s*\)/);
    if (translateMatch) {
       return { cx: parseFloat(translateMatch[1]), cy: parseFloat(translateMatch[2]) };
    }

    // 6. Last resort: use x,y as pivot or (0,0)
    return { cx: isNaN(x) ? 0 : x, cy: isNaN(y) ? 0 : y };
  };

  /**
   * Helper to consolidate transforms from both 'style' and 'transform' attribute.
   */
  const normalizeTransform = (el: SVGElement) => {
    const styleTransform = el.style.transform;
    const attrTransform = el.getAttribute("transform") || "";

    if (!styleTransform) return;

    const { cx, cy } = getElementCenter(el);
    const canComputeCenter = cx !== 0 || cy !== 0;

    // Only proceed with normalization if we have a solid center or it's a simple translate
    // Otherwise, we risk injecting (0,0) which causes the "flying away" bug
    let normalized = styleTransform
      .replace(/translate\(([^,)]+)px\s*,\s*([^,)]+)px\)/g, 'translate($1, $2)')
      .replace(/translate\(([^,)]+)px\)/g, 'translate($1)');

    // 2. Convert rotate(Xdeg) to rotate(X, cx, cy)
    normalized = normalized.replace(/rotate\(([^)]+)\)/g, (_fullMatch, p1) => {
      const angle = p1.replace('deg', '').trim();
      const parts = p1.split(/[ ,]+/);

      if (parts.length === 1 && canComputeCenter) {
        return `rotate(${angle}, ${cx}, ${cy})`;
      }
      
      // If we can't compute center and it's a naked rotate(angle), 
      // check if style has transform-origin: center. 
      // If it does, we should PROBABLY not normalize yet or use a better strategy.
      // For now, return valid SVG rotation
      return `rotate(${angle}${parts.length > 2 ? ',' + parts.slice(1).join(',') : ''})`;
    });

    // Merge them: style usually overrides attribute in browser
    const combined = `${attrTransform} ${normalized}`.trim();
    el.setAttribute("transform", combined);

    // CLEAR styles only if we successfully normalized with a pivot
    // If cx/cy are 0, we leave the styles so the browser can handle it with transform-origin: center
    if (canComputeCenter || !styleTransform.includes("rotate")) {
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.transformBox = "";
    }
  };

  fields.forEach((field) => {
    const targetId = field.svgElementId || field.id;
    const targets = findElements(targetId);

    // For select fields, we check options instead of a single element mapping
    if (targets.length === 0 && !(field.options && field.options.length > 0)) {
      return;
    }

    // Support dependency values with extraction
    let value: string = "";

    if ("dependsOn" in field && field.dependsOn) {
      value = extractFromDependency(field.dependsOn, allFieldValues);
    } else {
      value = String(field.currentValue ?? "");
    }

    // Handle select fields (options) - Toggle visibility based on selected option
    if (field.options && field.options.length > 0) {
      field.options.forEach((opt: any) => {
        if (opt.svgElementId) {
          const optEls = findElements(opt.svgElementId);
          optEls.forEach(optEl => {
            optEl.setAttribute("opacity", "0");
            optEl.setAttribute("visibility", "hidden");
            optEl.removeAttribute("style");
            optEl.setAttribute("display", "none");
          });
        }
      });

      const selectedOption = field.options.find(
        (opt: any) => String(opt.value) === String(field.currentValue)
      );
      if (selectedOption?.svgElementId) {
        const selectedEls = findElements(selectedOption.svgElementId);
        selectedEls.forEach(selectedEl => {
          selectedEl.setAttribute("opacity", "1");
          selectedEl.setAttribute("visibility", "visible");
          selectedEl.removeAttribute("display");
        });
      }
    }

    // Handle standard element updates (Text, Images, etc.)
    if (targets.length > 0) {
      targets.forEach(el => {
        // Consolidate any existing transforms (from style or attribute) before applying new ones
        normalizeTransform(el);

        const tagName = el.tagName.toLowerCase();
        const fieldType = (field.type || "text").toLowerCase();
        const isImageTag = tagName === 'image' || tagName === 'use';
        const isImageField = fieldType === "upload" || fieldType === "file" || fieldType === "sign";
        // Support .depends both as a type and as an extension in the ID for backward compatibility
        const isDependsField = fieldType === "depends" || field.id.includes('.depends');
        
        // Final sanity check: if the value is definitely an image data URL, we should allow updating image tags
        const isImageValue = typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('blob:') || value.includes('base64'));

        // For select fields, use the label/displayText if targeting a text element,
        // or the raw value if targeting an image element.
        let finalValue = value;
        if (field.options && field.options.length > 0 && (tagName === 'text' || tagName === 'tspan')) {
          const selected = field.options.find(
            (opt: any) => String(opt.value) === String(field.currentValue)
          );
          finalValue = selected?.displayText ?? selected?.label ?? value;
        }

        // 1. IMAGE-LIKE TAGS: <image> or <use>
        if (isImageTag) {
          // Only allow image updates if the field is an image field, a dependency field,
          // or if the value itself clearly looks like an image (backward compatibility).
          if (!isImageField && !isDependsField && !isImageValue) return;

          const hrefNS = "http://www.w3.org/1999/xlink";
          
          if (finalValue && finalValue.trim() !== "") {
            el.setAttribute("href", finalValue);
            el.setAttributeNS(hrefNS, "href", finalValue);
            el.setAttribute("preserveAspectRatio", "none");
            
            (el as SVGElement).style.transformBox = "fill-box";
            (el as SVGElement).style.transformOrigin = "center";
          }
        }
        // 2. VISIBILITY SPECIAL CASES
        else if (fieldType === "hide" || fieldType === "status") {
          let isVisible = false;
          if (typeof value === 'boolean') {
            isVisible = value;
          } else if (typeof value === 'string') {
            const valueStr = value.toLowerCase();
            isVisible = valueStr === "true" || valueStr === "1";
          }

          el.setAttribute("opacity", isVisible ? "1" : "0");
          el.setAttribute("visibility", isVisible ? "visible" : "hidden");
          if (isVisible) {
            el.removeAttribute("display");
          } else {
            el.setAttribute("display", "none");
          }
        }
        // 3. TEXT-LIKE TAGS: <text>, <tspan>, etc.
        else {
          // If the field is an image field but the tag is NOT an image, skip to avoid corruption
          if (isImageField) return;

          const stringValue = value === null || value === undefined ? "" : String(value);
          const shouldSkipUpdate = !field.touched && stringValue === "";
          if (shouldSkipUpdate) return;

          const maxWidth = parseFloat(field.attributes?.['data-max-width'] || '0');
          const { fontSize, fontFamily } = getSvgElementStyle(el, doc);

          if (tagName === 'text' && (stringValue.includes('\n') || maxWidth > 0)) {
            const userLines = stringValue.split('\n');
            let finalLines: string[] = [];

            const getWidth = (str: string) => {
              if (typeof document !== 'undefined') {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.font = `${fontSize}px ${fontFamily}`;
                  return ctx.measureText(str).width;
                }
              }
              return str.length * fontSize * 0.6;
            };

            for (const line of userLines) {
              if (maxWidth > 0 && line.trim() !== "") {
                const words = line.split(/\s+/);
                let currentLine = "";
                for (const word of words) {
                  const testLine = currentLine ? `${currentLine} ${word}` : word;
                  if (getWidth(testLine) > maxWidth && currentLine !== "") {
                    finalLines.push(currentLine);
                    currentLine = word;
                  } else {
                    currentLine = testLine;
                  }
                }
                if (currentLine) finalLines.push(currentLine);
              } else {
                finalLines.push(line);
              }
            }
            if (finalLines.length === 0) finalLines = [""];
            applyWrappedText(el, finalLines, fontSize, fontFamily, doc);
          } else {
            el.textContent = stringValue;
          }
        }

        // 4. UNIVERSAL TRANSFORMATIONS (Rotation)
        // Inheritance logic (sync with backend)
        let rotationValue = field.rotation;
        if ((rotationValue === undefined || rotationValue === null) && field.dependsOn) {
          const baseParentId = field.dependsOn.split('[')[0];
          const parentField = fieldsMap.get(baseParentId);
          if (parentField?.rotation !== undefined) {
             rotationValue = parentField.rotation;
          }
        }

        const rotation = rotationValue !== undefined && rotationValue !== null ? Number(rotationValue) : 0;
        if (rotation !== 0 || el.hasAttribute("data-base-transform")) {
          if (!el.hasAttribute("data-base-transform")) {
            el.setAttribute("data-base-transform", el.getAttribute("transform") || "");
          }
          const baseTransform = el.getAttribute("data-base-transform") || "";
          const { cx, cy } = getElementCenter(el);
          const baseWithoutRotation = baseTransform.replace(/rotate\s*\([^)]*\)/g, '').trim();
          const newRotation = `rotate(${rotation}, ${cx}, ${cy})`;
          const updatedTransform = baseWithoutRotation ? `${baseWithoutRotation} ${newRotation}` : newRotation;
          el.setAttribute("transform", updatedTransform);
        }
      });
    }
  });

  if (isDocument) return doc;
  return new XMLSerializer().serializeToString(doc);
}