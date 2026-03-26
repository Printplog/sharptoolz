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
    let dateFormat: string | undefined;
    const svgElementId = id;

    // If it's a select option
    if (parts.some(p => p.startsWith("select_"))) {
      const selectPart = parts.find(p => p.startsWith("select_"))!;
      const value = selectPart.replace("select_", "");
      const isEditable = parts.includes("editable");
      
      const selectOption: SelectOption = {
        value,
        label: textContent || value.replace(/_/g, " "),
        svgElementId: id,
      };
      if (!selectOptionsMap[baseId]) selectOptionsMap[baseId] = [];
      selectOptionsMap[baseId].push(selectOption);

      // Initialize field if not exists to store extensions found on options
      if (!fieldsMap[baseId]) {
        fieldsMap[baseId] = {
          id: baseId,
          name,
          type: "select",
          svgElementId,
          defaultValue: "",
          currentValue: "",
        };
      }
      
      if (isEditable) {
        fieldsMap[baseId].editable = true;
      }

      continue; // we'll build this later when finalizing the map
    }

    for (const part of parts.slice(1)) {
      if (part.startsWith("max_")) {
        max = parseInt(part.replace("max_", ""));
      } else if (part.startsWith("format_")) {
        // Extract format and replace underscores with spaces (common convention for IDs)
        // e.g. format_YYYY-MM-DD_HH:mm -> YYYY-MM-DD HH:mm
        const rawFormat = part.replace("format_", "");
        // If the format contains typical time separators like colon, it might be preserved
        // But if it uses underscores for spaces, we convert them
        if (rawFormat.includes("_")) {
           dateFormat = rawFormat.replace(/_/g, " ");
        } else {
           dateFormat = rawFormat;
        }
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
      ...(max ? { max } : {}),
      ...(dateFormat ? { dateFormat } : {})
    };
  }

  // Merge select options into form fields
  for (const id in selectOptionsMap) {
    if (!fieldsMap[id]) {
      fieldsMap[id] = {
        id,
        name: id.replace(/_/g, " "),
        type: "select",
        defaultValue: selectOptionsMap[id][0]?.value || "",
        currentValue: selectOptionsMap[id][0]?.value || "",
      };
    }
    
    fieldsMap[id].options = selectOptionsMap[id];
    // If we have options, it's definitely a select type
    fieldsMap[id].type = "select";
    
    if (!fieldsMap[id].currentValue && selectOptionsMap[id].length > 0) {
      fieldsMap[id].defaultValue = selectOptionsMap[id][0].value;
      fieldsMap[id].currentValue = selectOptionsMap[id][0].value;
    }
  }

  return Object.values(fieldsMap);
};

export default parseSvgToFormFields;
