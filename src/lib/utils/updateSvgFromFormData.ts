import { extractFromDependency } from "./fieldExtractor";
import { applyWrappedText, getSvgElementStyle } from "./textWrapping";
import type { FormField } from "@/types";

export default function updateSvgFromFormData(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  // Helper to find element by ID or internal ID
  const findElement = (id: string) => {
    if (!id) return null;
    return (
      doc.getElementById(id) ||
      doc.querySelector(`[data-internal-id="${id}"]`) ||
      doc.querySelector(`[name="${id}"]`) ||
      doc.querySelector(`[data-name="${id}"]`)
    );
  };

  fields.forEach((field) => {
    const targetId = field.svgElementId || field.id;
    const el = findElement(targetId);

    // For select fields, we check options instead of a single element mapping
    if (!el && !(field.options && field.options.length > 0)) {
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
          const optEl = findElement(opt.svgElementId);
          if (optEl) {
            // Use SVG attributes that will be preserved in serialization
            optEl.setAttribute("opacity", "0");
            optEl.setAttribute("visibility", "hidden");
            // Remove any existing display style and set it as an attribute
            optEl.removeAttribute("style");
            optEl.setAttribute("display", "none");
          }
        }
      });

      // Show only the selected option
      const selectedOption = field.options.find(
        (opt: any) => String(opt.value) === String(field.currentValue)
      );
      if (selectedOption?.svgElementId) {
        const selectedEl = findElement(selectedOption.svgElementId);
        if (selectedEl) {
          // Use SVG attributes that will be preserved in serialization
          selectedEl.setAttribute("opacity", "1");
          selectedEl.setAttribute("visibility", "visible");
          // Remove display attribute to show the element
          selectedEl.removeAttribute("display");
        }
      }
    } else {
      // Handle other field types
      if (!el) return;

      switch (field.type) {
        case "upload":
        case "file": {
          const hrefNS = "http://www.w3.org/1999/xlink";
          // Only update href if there's a value, otherwise preserve original
          if (value && value.trim() !== "") {
            el.setAttributeNS(hrefNS, "href", value);
          }

          // Apply rotation if present
          if (field.rotation !== undefined && field.rotation !== null) {
            const rotation = parseFloat(String(field.rotation));
            if (!isNaN(rotation) && rotation !== 0) {
              // Canvg doesn't support transform-origin: center well, so we calculate the center manually.
              // This is necessary because in the download engine (canvg), rotation defaults to (0,0).
              const x = parseFloat(el.getAttribute("x") || "0");
              const y = parseFloat(el.getAttribute("y") || "0");
              const w = parseFloat(el.getAttribute("width") || "0");
              const h = parseFloat(el.getAttribute("height") || "0");
              const cx = x + w / 2;
              const cy = y + h / 2;

              const rotationStr = `rotate(${rotation}, ${cx}, ${cy})`;

              // Preservation: Replace existing rotate(...) or append to existing transforms
              const existingTransform = el.getAttribute("transform") || "";
              let newTransform = "";

              if (existingTransform.includes("rotate(")) {
                newTransform = existingTransform.replace(/rotate\([^)]+\)/g, rotationStr);
              } else {
                newTransform = `${existingTransform} ${rotationStr}`.trim();
              }
              el.setAttribute("transform", newTransform);
            } else {
              // Only remove the rotate(...) part if it exists, preserve others (like translations)
              const existing = el.getAttribute("transform") || "";
              if (existing.includes("rotate(")) {
                const cleaned = existing.replace(/rotate\([^)]+\)/g, "").trim();
                if (cleaned) {
                  el.setAttribute("transform", cleaned);
                } else {
                  el.removeAttribute("transform");
                }
              }
            }

            // Keep style-based properties for browser-side preview compatibility
            el.style.transformBox = "fill-box";
            el.style.transformOrigin = "center";
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
    }
  });

  return new XMLSerializer().serializeToString(doc);
}