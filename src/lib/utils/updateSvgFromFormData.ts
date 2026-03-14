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

  // Helper to find all elements by ID or internal ID
  const findElements = (id: string): SVGElement[] => {
    if (!id) return [];

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

    // Filter duplicates and return as SVGElement array
    return Array.from(new Set(results)) as SVGElement[];
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
      // Build field value map for extraction.
      // For select fields, use the human-readable option text instead of the raw id,
      // so .gen and other dependency-based fields see the actual value.
      const allFieldValues: Record<string, string | number | boolean | unknown> = {};
      fields.forEach((f) => {
        if (f.type === "select" && f.options && f.options.length > 0) {
          const selected = f.options.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (opt: any) => String(opt.value) === String(f.currentValue)
          );
          allFieldValues[f.id] =
            selected?.displayText ?? selected?.label ?? f.currentValue ?? "";
        } else {
          allFieldValues[f.id] = f.currentValue ?? "";
        }
      });

      // Use extraction utility to handle dependencies with patterns
      value = extractFromDependency(field.dependsOn, allFieldValues);
    } else {
      value = String(field.currentValue ?? "");
    }

    // Handle select fields (options)
    if (field.options && field.options.length > 0) {
      // Hide all options first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      field.options.forEach((opt: any) => {
        if (opt.svgElementId) {
          const optEls = findElements(opt.svgElementId);
          optEls.forEach(optEl => {
            // Use SVG attributes that will be preserved in serialization
            optEl.setAttribute("opacity", "0");
            optEl.setAttribute("visibility", "hidden");
            // Remove any existing display style and set it as an attribute
            optEl.removeAttribute("style");
            optEl.setAttribute("display", "none");
          });
        }
      });

      // Show only the selected option
      const selectedOption = field.options.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (opt: any) => String(opt.value) === String(field.currentValue)
      );
      if (selectedOption?.svgElementId) {
        const selectedEls = findElements(selectedOption.svgElementId);
        selectedEls.forEach(selectedEl => {
          // Use SVG attributes that will be preserved in serialization
          selectedEl.setAttribute("opacity", "1");
          selectedEl.setAttribute("visibility", "visible");
          // Remove display attribute to show the element
          selectedEl.removeAttribute("display");
        });
      }
    } else {
      // Handle other field types
      if (targets.length === 0) return;

      targets.forEach(el => {
        // Consolidate any existing transforms (from style or attribute) before applying new ones
        normalizeTransform(el);

        switch (field.type) {
          case "sign":
          case "upload":
          case "file": {
            const hrefNS = "http://www.w3.org/1999/xlink";
            // Only update href if there's a value, otherwise preserve original.
            // IMPORTANT: We do NOT override x, y, width, height, transform, or
            // preserveAspectRatio — those come from the original SVG template placeholder
            // and define exactly where/how the image is placed/sized.
            if (value && value.trim() !== "") {
              el.setAttribute("href", value);
              el.setAttributeNS(hrefNS, "href", value);
              el.setAttribute("preserveAspectRatio", "none");
              
              // Set style-based properties for browser-side redundancy and stable rotation pivot
              (el as SVGElement).style.transformBox = "fill-box";
              (el as SVGElement).style.transformOrigin = "center";
            }

            // Apply user-controlled rotation ON TOP of the original template rotation.
            // IMPORTANT: We save the original (template) transform the first time we
            // encounter this element so that repeated calls to updateSvgFromFormData
            // (e.g. every live-preview refresh) don't keep stacking rotate() calls.
            let rotationValue = field.rotation;

            // Inheritance: if this field has no rotation of its own but depends on
            // another image field, inherit that field's rotation (e.g. ghost overlays).
            if ((rotationValue === undefined || rotationValue === null) && field.dependsOn) {
              const baseParentId = field.dependsOn.split('[')[0];
              const parentField = fieldsMap.get(baseParentId);
              if (parentField?.rotation !== undefined && parentField?.rotation !== null) {
                rotationValue = parentField.rotation;
              }
            }

            if (rotationValue !== undefined && rotationValue !== null) {
              const rotation = parseFloat(String(rotationValue));
              if (isNaN(rotation)) break; // Skip invalid

              // Snapshot the *original template* transform once and cache it.
              if (!el.hasAttribute("data-base-transform")) {
                el.setAttribute("data-base-transform", el.getAttribute("transform") || "");
              }
              const baseTransform = el.getAttribute("data-base-transform") || "";

              // Build final transform: base template (with any existing rotations removed to prevent stacking) + exactly one NEW user rotation
              const { cx, cy } = getElementCenter(el);
              const baseWithoutRotation = baseTransform.replace(/rotate\s*\([^)]*\)/g, '').trim();
              const newRotation = `rotate(${rotation}, ${cx}, ${cy})`;
              const updatedTransform = baseWithoutRotation ? `${baseWithoutRotation} ${newRotation}` : newRotation;
              el.setAttribute("transform", updatedTransform);
              
              // Always ensure stable pivot styles are present for active fields
              (el as SVGElement).style.transformBox = "fill-box";
              (el as SVGElement).style.transformOrigin = "center";
            }
            break;
          }

          case "hide": {
            // Toggle visibility based on checkbox state
            // When checked (true), SHOW the overlay element; when unchecked (false), HIDE it
            // This is reversed from normal hide behavior because these elements are overlays
            // Determine visibility based on the value
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
            break;
          }
          default: {
            const stringValue = value === null || value === undefined ? "" : String(value);
            const shouldSkipUpdate = !field.touched && stringValue === "";
            if (shouldSkipUpdate) {
              return;
            }

            const maxWidth = parseFloat(field.attributes?.['data-max-width'] || '0');

            // Use improved font style detection that checks attributes, inline styles, and class definitions
            const { fontSize, fontFamily } = getSvgElementStyle(el, doc);

            // Check if we need special handling: manual newlines OR max width wrapping
            if (el.tagName.toLowerCase() === 'text' && (stringValue.includes('\n') || maxWidth > 0)) {
              // Split by line breaks to respect user's intentional newlines (from SeamlessEditor)
              const userLines = stringValue.split('\n');
              let finalLines: string[] = [];

              // Helper for measuring text width (canvas or heuristic)
              const getWidth = (str: string) => {
                // Try to use canvas if available in this context
                if (typeof document !== 'undefined') {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.font = `${fontSize}px ${fontFamily}`; // Use actual font family
                    return ctx.measureText(str).width;
                  }
                }
                // Fallback
                return str.length * fontSize * 0.6;
              };

              for (const line of userLines) {
                // If max width is set, wrap this line further
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
                  // No wrapping, just keep the line (even if empty, to preserve spacing)
                  finalLines.push(line);
                }
              }

              // If the resulting lines are empty (e.g. empty input), ensure at least one empty line to clear
              if (finalLines.length === 0) finalLines = [""];

              // Render using shared logic (font-aware spacing)
              // Pass 'fontFamily' and 'doc' since we are using a DOMParser document
              applyWrappedText(el, finalLines, fontSize, fontFamily, doc);
            } else {
              el.textContent = stringValue;
            }

            // Apply rotation to text/other fields
            const rotationValue = field.rotation;
            if (rotationValue !== undefined && rotationValue !== null) {
              const rotation = parseFloat(String(rotationValue));
              if (!isNaN(rotation)) {
                if (!el.hasAttribute("data-base-transform")) {
                  el.setAttribute("data-base-transform", el.getAttribute("transform") || "");
                }
                const baseTransform = el.getAttribute("data-base-transform") || "";
                
                const cx = parseFloat(el.getAttribute("x") || "0");
                const cy = parseFloat(el.getAttribute("y") || "0");
                
                const newRotation = `rotate(${rotation}, ${cx}, ${cy})`;
                const updatedTransform = baseTransform ? `${baseTransform} ${newRotation}` : newRotation;
                el.setAttribute("transform", updatedTransform);
              }
            }
          }
        }
      }); // end targets.forEach
    }
  });

  if (isDocument) return doc;
  return new XMLSerializer().serializeToString(doc);
}