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
      // Build field value map for extraction
      const allFieldValues: Record<string, string | number | boolean> = {};
      fields.forEach(f => {
        allFieldValues[f.id] = f.currentValue || '';
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
          el.textContent = value;
        }
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}