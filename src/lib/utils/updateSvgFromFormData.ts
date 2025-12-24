import type { FormField } from "@/types";
import { extractFromDependency } from "./fieldExtractor";

export default function updateSvgFromFormData(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  fields.forEach((field) => {
    // For select fields, svgElementId is not used (it's just a group, not a real SVG element)
    if ((!field.svgElementId || !doc.getElementById(field.svgElementId)) && !(field.options && field.options.length > 0)) {
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
            (opt) => String(opt.value) === String(f.currentValue)
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
      field.options.forEach((opt) => {
        if (opt.svgElementId) {
          const optEl = doc.getElementById(opt.svgElementId);
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
        (opt) => String(opt.value) === String(field.currentValue)
      );
      if (selectedOption?.svgElementId) {
        const selectedEl = doc.getElementById(selectedOption.svgElementId);
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
      const el = field.svgElementId ? doc.getElementById(field.svgElementId) : null;
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
            // Use CSS transform-box and transform-origin for reliable center rotation
            // This avoids manual calculation of cx, cy which can be tricky with units/viewBox
            el.style.transformBox = "fill-box";
            el.style.transformOrigin = "center";
            el.setAttribute("transform", `rotate(${field.rotation})`);
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
          // For text elements with a max width, we apply tspan wrapping
          if (el.tagName.toLowerCase() === 'text' && maxWidth > 0) {
            const fontSize = parseFloat(field.attributes?.['font-size'] || '16');
            
            // Manual local implementation of wrapping to avoid complicated external dependency imports in utility
            const words = stringValue.split(/\s+/);
            const lines: string[] = [];
            let currentLine = "";
            const charWidthRatio = 0.55; 
            const getWidth = (str: string) => str.length * fontSize * charWidthRatio;

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              if (getWidth(testLine) > maxWidth && currentLine !== "") {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) lines.push(currentLine);

            el.textContent = "";
            const x = el.getAttribute("x") || "0";
            
            lines.forEach((line, i) => {
              const tspan = doc.createElementNS("http://www.w3.org/2000/svg", "tspan");
              tspan.textContent = line;
              tspan.setAttribute("x", x);
              if (i > 0) tspan.setAttribute("dy", "1.2em");
              el.appendChild(tspan);
            });
          } else {
            el.textContent = stringValue;
          }
        }
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}