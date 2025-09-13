import type { FormField } from "@/types";

export default function updateSvgFromFormData(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  const fieldMap = Object.fromEntries(fields.map(f => [f.id, f]));

  fields.forEach((field) => {
    // For select fields, svgElementId is not used (it's just a group, not a real SVG element)
    if ((!field.svgElementId || !doc.getElementById(field.svgElementId)) && !(field.options && field.options.length > 0)) {
      return;
    }

    // Support dependency values
    let value: string = "";

    if ("dependsOn" in field && field.dependsOn && fieldMap[field.dependsOn]) {
      value = String(fieldMap[field.dependsOn].currentValue ?? "");
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
        (opt) => String(opt.value) === field.currentValue
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
        default: {
          el.textContent = value;
        }
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}