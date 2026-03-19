import { type SvgElement } from "@/lib/utils/parseSvgElements";
import { type FormField, type SelectOption } from "@/types";
import { validateSvgId } from "@/lib/utils/svgIdValidator";

/**
 * Extracts a basic FormField structure from a list of SvgElements.
 * This is used for IDE-grade PREVIEW before the template is saved to the backend.
 * Synthesizes grammar from the ID DSL.
 */
export function extractFieldsFromElements(elements: SvgElement[]): FormField[] {
  const fieldsMap = new Map<string, FormField>();

  elements.forEach((el) => {
    const id = el.id || el.originalId;
    if (!id || !id.includes(".")) return;

    const validation = validateSvgId(id);
    if (!validation.valid) return;

    const parts = id.split(".");
    const baseId = parts[0];
    const extensions = parts.slice(1);

    // 1. Identify Field Type or Dependency
    let type = "text";
    let dependsOn: string | undefined;

    const dependsPart = extensions.find(e => e.startsWith("depends_"));
    if (dependsPart) {
      dependsOn = dependsPart.replace("depends_", "");
      type = "depends";
    } else {
      // Look for explicit type extension at position 1
      const typePart = extensions[0];
      const validTypes = ["text", "textarea", "upload", "file", "sign", "date", "gen", "number", "checkbox", "range", "color", "email", "tel", "status", "password"];
      if (validTypes.includes(typePart)) {
        type = typePart;
      }
    }

    // 2. Identify Options (Select fields)
    const selectPart = extensions.find(e => e.startsWith("select_"));
    if (selectPart) {
      const optionValue = selectPart.replace("select_", "");
      const existing = fieldsMap.get(baseId);
      
      const option: SelectOption = {
        value: optionValue,
        label: optionValue.replace(/_/g, " "),
        svgElementId: el.internalId || id,
        displayText: el.innerText
      };

      if (existing) {
        if (!existing.options) existing.options = [];
        existing.options.push(option);
        existing.type = "select"; // Force type to select if options exist
        return;
      } else {
        fieldsMap.set(baseId, {
          id: baseId,
          name: baseId.replace(/_/g, " "),
          type: "select",
          svgElementId: baseId, // Grouped field doesn't have a single element ID
          options: [option],
          currentValue: optionValue, // Default to first option
        });
        return;
      }
    }

    // 3. Identify Modifiers
    let generationRule: string | undefined;
    let isTrackingId = false;
    let trackingRole: string | undefined;
    let requiresGrayscale = false;

    extensions.forEach(ext => {
      if (ext.startsWith("gen_")) generationRule = ext.replace("gen_", "");
      if (ext === "tracking_id") isTrackingId = true;
      if (ext.startsWith("track_")) trackingRole = ext.replace("track_", "");
      if (ext.startsWith("grayscale")) requiresGrayscale = true;
    });

    // 4. Create or Update Field
    const field: FormField = {
      id: baseId,
      name: baseId.replace(/_/g, " "),
      type,
      svgElementId: el.internalId || id,
      currentValue: el.innerText || "",
      dependsOn,
      generationRule,
      isTrackingId,
      trackingRole,
      requiresGrayscale,
      helperText: el.attributes["data-helper"],
      attributes: el.attributes
    };

    // If ID is exactly the base plus type, it's a primary element
    // Otherwise it might be a modifier element (like an icon)
    fieldsMap.set(baseId, field);
  });

  return Array.from(fieldsMap.values());
}
