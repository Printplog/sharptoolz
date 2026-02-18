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
      } catch (e) { /* ignore invalid selectors */ }
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
    const cx = x + w / 2;
    const cy = y + h / 2;

    // Convert CSS transforms to SVG attribute format
    // 1. Convert translate(Xpx, Ypx) to translate(X, Y)
    let normalized = styleTransform
      .replace(/translate\(([^,)]+)px\s*,\s*([^,)]+)px\)/g, 'translate($1, $2)')
      .replace(/translate\(([^,)]+)px\)/g, 'translate($1)');

    // 2. Convert rotate(Xdeg) to rotate(X, cx, cy)
    // We must inject the center coordinates because the attribute transform defaults to (0,0)
    normalized = normalized.replace(/rotate\(([^)]+)\)/g, (_, p1) => {
      const angle = p1.replace('deg', '').trim();
      return `rotate(${angle}, ${cx}, ${cy})`;
    });

    // Merge them: style usually overrides attribute in browser
    const combined = `${attrTransform} ${normalized}`.trim();
    el.setAttribute("transform", combined);

    // Clear styles to prevent double application in browser
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
      const allFieldValues: Record<string, string | number | boolean | any> = {};
      fields.forEach((f) => {
        if (f.type === "select" && f.options && f.options.length > 0) {
          const selected = f.options.find(
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
        normalizeTransform(el as any);

        switch (field.type) {
          case "upload":
          case "file": {
            const hrefNS = "http://www.w3.org/1999/xlink";
            // Only update href if there's a value, otherwise preserve original
            if (value && value.trim() !== "") {
              el.setAttributeNS(hrefNS, "href", value);
            }

            // Apply rotation if present
            let rotationValue = field.rotation;

            // Inheritance logic: If this field depends on another field AND has no rotation of its own,
            // try to inherit the rotation from the parent field.
            // This ensures ghost photos and overlays follow the main photo's transformation.
            if ((rotationValue === undefined || rotationValue === null) && field.dependsOn) {
              const baseParentId = field.dependsOn.split('[')[0];
              const parentField = fieldsMap.get(baseParentId);
              if (parentField?.rotation !== undefined && parentField?.rotation !== null) {
                rotationValue = parentField.rotation;
              }
            }

            if (rotationValue !== undefined && rotationValue !== null) {
              const rotation = parseFloat(String(rotationValue));

              // Canvg doesn't support transform-origin: center well, so we calculate the center manually.
              // This is necessary because in the download engine (canvg), rotation defaults to (0,0).
              const x = parseFloat(el.getAttribute("x") || "0");
              const y = parseFloat(el.getAttribute("y") || "0");
              const w = parseFloat(el.getAttribute("width") || "0");
              const h = parseFloat(el.getAttribute("height") || "0");
              const cx = x + w / 2;
              const cy = y + h / 2;

              const rotationStr = rotation !== 0 ? `rotate(${rotation}, ${cx}, ${cy})` : "";

              const existingTransform = el.getAttribute("transform") || "";
              let newTransform = "";

              if (existingTransform.includes("rotate(")) {
                // Replace existing rotation
                newTransform = existingTransform.replace(/rotate\([^)]+\)/g, rotationStr).trim();
              } else if (rotationStr) {
                // Append new rotation
                newTransform = `${existingTransform} ${rotationStr}`.trim();
              } else {
                newTransform = existingTransform;
              }

              if (newTransform) {
                el.setAttribute("transform", newTransform);
              } else {
                el.removeAttribute("transform");
              }

              // Also set style-based properties for browser-side redundancy, 
              // but the normalization should have handled the attribute correctly.
              // We use 'fill-box' to help browsers that prioritize CSS.
              (el as SVGElement).style.transformBox = "fill-box";
              (el as SVGElement).style.transformOrigin = "center";
            }
            break;
          }
          case "sign": {
            const hrefNS = "http://www.w3.org/1999/xlink";
            // Only update href if there's a value, otherwise preserve original
            if (value && value.trim() !== "") {
              el.setAttributeNS(hrefNS, "href", value);
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