// utils/parseSvgToFormFields.ts
import type { FormField, SelectOption } from "@/types";

const parseSvgToFormFields = (svgText: string): FormField[] => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  const elements = Array.from(svgDoc.querySelectorAll("[id]"));

  const fieldsMap: Record<string, FormField> = {};
  const selectOptionsMap: Record<string, SelectOption[]> = {};

  for (const el of elements) {
    const id = el.getAttribute("id") || "";
    const textContent = el.textContent?.trim() || "";

    const parts = id.split(".");
    const baseId = parts[0];
    const name = baseId.replace(/_/g, " ");
    let type = id.split(".")[0];
    let max: number | undefined;
    const svgElementId = id;

    // If it's a select option
    if (parts.some(p => p.startsWith("select_"))) {
      const selectOption: SelectOption = {
        value: id,
        label: id.replace(/_/g, " "),
        svgElementId: id,
      };
      if (!selectOptionsMap[baseId]) selectOptionsMap[baseId] = [];
      selectOptionsMap[baseId].push(selectOption);
      continue; // we'll build this later when finalizing the map
    }

    for (const part of parts.slice(1)) {
      if (part.startsWith("max_")) {
        max = parseInt(part.replace("max_", ""));
      } else if (
        [
          "text", "textarea", "checkbox", "date", "upload", "number",
          "email", "tel", "gen", "password", "range", "color", "file"
        ].includes(part)
      ) {
        type = part;
      }
    }

    fieldsMap[baseId] = {
      id: baseId,
      name,
      type,
      svgElementId,
      defaultValue: type === "checkbox" ? false : textContent,
      currentValue: type === "checkbox" ? false : textContent,
      ...(max ? { max } : {})
    };
  }

  // Merge select options into form fields
  for (const id in selectOptionsMap) {
    const field: FormField = {
      id,
      name: id.replace(/_/g, " "),
      type: "text", // We can override this in frontend if options exist
      options: selectOptionsMap[id],
      defaultValue: selectOptionsMap[id][0]?.value || "",
      currentValue: selectOptionsMap[id][0]?.value || "",
    };
    fieldsMap[id] = field;
  }

  return Object.values(fieldsMap);
};

export default parseSvgToFormFields;
