import type { FormField } from "@/types";

export default function updateSvgFromFields(svgRaw: string, fields: FormField[]): string {
  if (!svgRaw) return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgRaw, "image/svg+xml");

  // Convert to map for easy lookup
  const fieldMap = Object.fromEntries(fields.map(f => [f.id, f]));

  fields.forEach((field) => {
    if (!field.svgElementId) return;

    const el = doc.getElementById(field.svgElementId);
    if (!el) return;

    // Support dependency values
    let value: string = "";

    if ("dependsOn" in field && field.dependsOn && fieldMap[field.dependsOn]) {
      value = String(fieldMap[field.dependsOn].currentValue ?? "");
    } else {
      value = String(field.currentValue ?? "");
    }

    switch (field.type) {
      case "upload": {
        const hrefNS = "http://www.w3.org/1999/xlink";
        el.setAttributeNS(hrefNS, "href", value);
        break;
      }

      case "select": {
        field.options?.forEach((opt) => {
          const optEl = doc.getElementById(opt.svgElementId || "");
          if (optEl) optEl.setAttribute("opacity", "0");
        });

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
        el.textContent = value;
      }
    }
  });

  return new XMLSerializer().serializeToString(doc);
}
