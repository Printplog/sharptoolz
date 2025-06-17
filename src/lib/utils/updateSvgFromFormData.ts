import type { FormField } from "@/types";

export default function updateSvgFromFields(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  fields.forEach((field) => {
    if (!field.svgElementId) return;

    const el = doc.getElementById(field.svgElementId);
    if (!el) return;

    const value = String(field.currentValue ?? "");

    switch (field.type) {
      case "upload": {
        // Handle uploaded image: update href of <image>
        const hrefNS = "http://www.w3.org/1999/xlink";
        el.setAttributeNS(hrefNS, "href", value);
        break;
      }

      case "select": {
        // Hide all select options first
        field.options?.forEach((opt) => {
          const optEl = doc.getElementById(opt.svgElementId || "");
          if (optEl) optEl.setAttribute("opacity", "0");
        });

        // Show only selected option
        const selectedOption = field.options?.find(
          (opt) => String(opt.value) === value
        );
        if (selectedOption?.svgElementId) {
          const selectedEl = doc.getElementById(selectedOption.svgElementId);
          if (selectedEl) selectedEl.setAttribute("opacity", "1");
        }
        break;
      }

      default: {
        // Default behavior: update text content
        el.textContent = value;
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}
