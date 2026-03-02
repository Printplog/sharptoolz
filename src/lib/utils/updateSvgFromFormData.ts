import { extractFromDependency } from "./fieldExtractor";
import { applyWrappedText, getSvgElementStyle } from "./textWrapping";
import type { FormField } from "@/types";

export default function updateSvgFromFormData(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

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

    // Filter duplicates and return as SVGElement array
    return Array.from(new Set(results)) as SVGElement[];
  };

  /**
   * Helper to consolidate transforms from both 'style' and 'transform' attribute.
   * Canvg and some other SVG post-processors have trouble with CSS transforms
   * or conflicting attributes. This ensures everything is in the 'transform' attribute.
   */
  const normalizeTransform = (el: SVGElement) => {
    const styleTransform = el.style.transform;
    const attrTransform = el.getAttribute("transform") || "";

    if (!styleTransform) return;

    // Get element dimensions for center calculation if needed
    const x = parseFloat(el.getAttribute("x") || "0");
    const y = parseFloat(el.getAttribute("y") || "0");
    const w = parseFloat(el.getAttribute("width") || "0");
    const h = parseFloat(el.getAttribute("height") || "0");

    // Skip if can't compute valid center (protects images)
    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      el.style.transform = "";  // Just clear invalid style
      return;
    }

    const hasDimensions = el.hasAttribute("width") && el.hasAttribute("height");
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Convert CSS transforms to SVG attribute format
    // 1. Convert translate(Xpx, Ypx) to translate(X, Y)
    let normalized = styleTransform
      .replace(/translate\(([^,)]+)px\s*,\s*([^,)]+)px\)/g, 'translate($1, $2)')
      .replace(/translate\(([^,)]+)px\)/g, 'translate($1)');

    // 2. Convert rotate(Xdeg) to rotate(X, cx, cy)
    // SVG attributes MUST NOT have 'deg' units. We strip them and inject center if possible.
    normalized = normalized.replace(/rotate\(([^)]+)\)/g, (_fullMatch, p1) => {
      const parts = p1.split(',');
      const angle = parts[0].replace('deg', '').trim();

      if (parts.length === 1 && hasDimensions) {
        return `rotate(${angle}, ${cx}, ${cy})`;
      }
      // If it already has parameters or we can't calculate a center, 
      // just ensure it's a valid SVG rotate (no units)
      return `rotate(${angle}${parts.length > 1 ? ',' + parts.slice(1).join(',') : ''})`;
    });

    // Merge them: style usually overrides attribute in browser
    const combined = `${attrTransform} ${normalized}`.trim();
    el.setAttribute("transform", combined);

    // Clear styles to prevent double application, but only the transform ones
    el.style.transform = "";
    el.style.transformOrigin = "";
    el.style.transformBox = "";
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
        // ONLY normalize non-image elements (images rely on x/y/w/h positioning)
        if (el.tagName.toLowerCase() !== 'image') {
          normalizeTransform(el);
        }

        switch (field.type) {
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
              // Preserve the original preserveAspectRatio if set by template designer.
              // Only fall back to "xMidYMid meet" (fit box) if no value is present.
              if (!el.getAttribute("preserveAspectRatio")) {
                el.setAttribute("preserveAspectRatio", "xMidYMid meet");
              }
            }

            // Apply user-controlled rotation ON TOP of the existing template rotation.
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

              let cx = 0, cy = 0;
              try {
                // Use getBBox() for accurate bounds (handles viewBox/transforms)
                const bbox = (el as any).getBBox();
                cx = bbox.x + bbox.width / 2;
                cy = bbox.y + bbox.height / 2;
              } catch (e) {
                // Fallback to explicit attributes if getBBox is unsupported in the current DOM environment
                const x = parseFloat(el.getAttribute("x") || "0");
                const y = parseFloat(el.getAttribute("y") || "0");
                const w = parseFloat(el.getAttribute("width") || "0");
                const h = parseFloat(el.getAttribute("height") || "0");
                cx = x + w / 2;
                cy = y + h / 2;
              }

              // Append NEW rotation to END of existing transform (composes correctly)
              const existingTransform = el.getAttribute("transform") || "";
              const newRotation = `rotate(${rotation}, ${cx}, ${cy})`;
              const updatedTransform = existingTransform ? `${existingTransform} ${newRotation}` : newRotation;
              el.setAttribute("transform", updatedTransform);
            }
            break;
          }
          case "sign": {
            const hrefNS = "http://www.w3.org/1999/xlink";
            // Only update href if there's a value, otherwise preserve original
            if (value && value.trim() !== "") {
              el.setAttribute("href", value);
              el.setAttributeNS(hrefNS, "href", value);
              if (!el.getAttribute("preserveAspectRatio")) {
                el.setAttribute("preserveAspectRatio", "xMidYMid meet");
              }
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
          }
        }
      }); // end targets.forEach
    }
  });

  return new XMLSerializer().serializeToString(doc);
}