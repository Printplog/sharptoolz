import type { FormField } from "@/types";
import { extractFromDependency } from "./fieldExtractor";

/**
 * Optimized version that only updates specific fields instead of processing all fields
 * This is much faster when only a few fields have changed
 */
export default function updateSvgFromFormDataOptimized(
  svgRaw: string,
  allFields: FormField[],
  changedFieldIds: string[]
): string {
  if (!svgRaw || changedFieldIds.length === 0) return svgRaw;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  // Build field value map for dependencies
  // For select fields, use the human-readable option text instead of the raw id,
  // so .gen and other dependency-based fields see the actual value.
  const allFieldValues: Record<string, string | number | boolean | unknown> = {};
  allFields.forEach((f) => {
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

  // Find all fields that need updating (changed fields + their dependents)
  const fieldsToUpdate = new Set<string>(changedFieldIds);

  // Add dependent fields (fields that depend on changed fields)
  allFields.forEach(field => {
    if (field.dependsOn) {
      // Extract base field name from dependency (e.g., "field_name[w1]" -> "field_name")
      const baseDependsOn = field.dependsOn.split('[')[0];
      if (changedFieldIds.includes(baseDependsOn)) {
        fieldsToUpdate.add(field.id);
      }
    }
  });

  // Only process fields that need updating
  allFields.forEach((field) => {
    if (!fieldsToUpdate.has(field.id)) {
      return; // Skip unchanged fields
    }

    // For select fields, svgElementId is not used (it's just a group, not a real SVG element)
    if ((!field.svgElementId || !doc.getElementById(field.svgElementId)) && !(field.options && field.options.length > 0)) {
      return;
    }

    // Support dependency values with extraction
    let value: string = "";

    if ("dependsOn" in field && field.dependsOn) {
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
          el.textContent = stringValue;
        }
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}

