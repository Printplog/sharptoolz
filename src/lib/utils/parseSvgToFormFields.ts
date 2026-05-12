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
    let type = "text";
    let max: number | undefined;
    let dateFormat: string | undefined;
    let generationRule: string | undefined;
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
        // Extract format and replace underscores with spaces
        const rawFormat = part.replace("format_", "");
        dateFormat = rawFormat.replace(/_/g, " ");
      } else if (part.startsWith("gen_")) {
        type = "gen";
        generationRule = part.replace("gen_", "");
      } else if (part.startsWith("qrcode_")) {
        type = "qrcode";
        generationRule = part.replace("qrcode_", "");
      } else if (
        [
          "text", "textarea", "checkbox", "date", "upload", "number",
          "email", "tel", "gen", "password", "range", "color", "file", "qrcode"
        ].includes(part)
      ) {
        // Only update type if it's currently the default 'text' or we're explicitly setting it to a specialized type.
        // We don't want a trailing '.text' or '.textarea' to overwrite '.qrcode_...' or '.gen_...'
        if (type === "text" || (part !== "text" && part !== "textarea")) {
          type = part;
        }
      }
    }

    if (type === "qrcode") {
      console.log(`[Parser] Found QR field: ${baseId}, rule: ${generationRule}`);
    }

    fieldsMap[baseId] = {
      id: baseId,
      name,
      type,
      svgElementId,
      defaultValue: type === "checkbox" ? false : textContent,
      currentValue: type === "checkbox" ? false : textContent,
      ...(max ? { max } : {}),
      ...(dateFormat ? { dateFormat } : {}),
      ...(generationRule ? { generationRule } : {})
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
