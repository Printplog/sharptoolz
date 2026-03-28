// ID Extension definitions for SVG element IDs
// This file contains all the rules for valid ID syntax and auto-suggestions

export interface ExtensionDefinition {
  key: string;
  label: string;
  helper: string;
  requiresValue?: boolean; // If true, expects a value after underscore (e.g., max_50)
  valuePlaceholder?: string; // Placeholder for the value input
  allowedAfter?: string[]; // Which field types this can come after
  mustBeLast?: boolean; // If true, this must be the last extension
  mustBeFirst?: boolean; // If true, this must come at position 1 (after base ID)
  isFieldType?: boolean; // If true, this is a field type (can only have one)
}

// Field types that must come immediately after the base ID (first ".")
export const FIELD_TYPES: ExtensionDefinition[] = [
  {
    key: "text",
    label: "Text",
    helper: "Creates a text input field",
  },
  {
    key: "textarea",
    label: "Textarea",
    helper: "Creates a large text area field",
  },
  {
    key: "gen",
    label: "Generate",
    helper: "Creates a field that generates random codes",
  },
  {
    key: "email",
    label: "Email",
    helper: "Creates an email input field",
  },
  {
    key: "number",
    label: "Number",
    helper: "Creates a number input field",
  },
  {
    key: "date",
    label: "Date",
    helper: "Creates a date picker field (basic YYYY-MM-DD format)",
  },
  {
    key: "checkbox",
    label: "Checkbox",
    helper: "Creates a checkbox field",
  },
  {
    key: "upload",
    label: "Upload",
    helper: "Creates a file upload field",
  },
  {
    key: "tel",
    label: "Telephone",
    helper: "Creates a telephone number input field",
  },
  {
    key: "password",
    label: "Password",
    helper: "Creates a password input field",
  },
  {
    key: "range",
    label: "Range",
    helper: "Creates a range slider field",
  },
  {
    key: "color",
    label: "Color",
    helper: "Creates a color picker field",
  },
  {
    key: "file",
    label: "File",
    helper: "Creates a file input field",
  },
  {
    key: "status",
    label: "Status",
    helper: "Creates a status field",
  },
  {
    key: "sign",
    label: "Signature",
    helper: "Creates a signature field",
  },
  {
    key: "select",
    label: "Select Option",
    helper: "Creates a dropdown option (e.g., select_USA)",
    requiresValue: true,
    valuePlaceholder: "Enter option value",
  },
].map(ft => ({ ...ft, isFieldType: true }));

// Extensions that can come after field types
export const EXTENSIONS: ExtensionDefinition[] = [
  {
    key: "depends",
    label: "Depends On",
    helper:
      "Field depends on another field (e.g., depends_FieldName or depends_FieldName[w1]). IMPORTANT: Must come FIRST after base ID.",
    requiresValue: true,
    valuePlaceholder: "Enter field name (e.g., Country or Country[w1])",
    mustBeFirst: true, // Special: must come at position 1 (after base ID)
  },
  {
    key: "max",
    label: "Max Length",
    helper: "Sets maximum character/number limit (e.g., max_50)",
    requiresValue: true,
    valuePlaceholder: "Enter number (e.g., 50)",
    allowedAfter: ["text", "textarea", "gen", "number", "range", "min"],
  },
  {
    key: "min",
    label: "Min Length",
    helper: "Sets minimum character/number limit (e.g., min_5)",
    requiresValue: true,
    valuePlaceholder: "Enter number (e.g., 5)",
    allowedAfter: ["text", "textarea", "gen", "number", "range", "max"],
  },
  {
    key: "editable",
    label: "Editable",
    helper: "Marks field as editable even after document purchase",
    allowedAfter: [
      "text",
      "textarea",
      "gen",
      "email",
      "number",
      "date",
      "checkbox",
      "upload",
      "tel",
      "password",
      "range",
      "color",
      "file",
      "status",
      "sign",
      "select",
      "depends",
    ],
  },
  {
    key: "track",
    label: "Tracking Role",
    helper:
      "Maps field to tracking role (e.g., track_name, track_email). MUST be last extension",
    requiresValue: true,
    valuePlaceholder: "Enter role (e.g., name, email, status)",
    mustBeLast: true,
    allowedAfter: [
      "text",
      "textarea",
      "gen",
      "email",
      "number",
      "date",
      "checkbox",
      "upload",
      "tel",
      "password",
      "range",
      "color",
      "file",
      "status",
      "sign",
      "select",
      "editable",
      "max",
      "tracking_id",
      "link",
      "date_format",
      "gen_rule",
      "grayscale",
      "hide",
      "depends",
      "show_if",
    ],
  },
  {
    key: "tracking_id",
    label: "Tracking ID",
    helper: "Marks this field as the main tracking ID",
    allowedAfter: ["gen", "max", "min", "text", "number"],
  },
  {
    key: "link",
    label: "Link",
    helper:
      "Adds tracking link URL where the ID will be tracked (e.g., link_https://example.com). Only for tracking_id fields.",
    requiresValue: true,
    valuePlaceholder: "Enter URL (e.g., https://example.com)",
    allowedAfter: ["tracking_id"],
  },
  {
    key: "date_format",
    label: "Date Format",
    helper:
      "Custom date format (e.g., date_MM/DD/YYYY or date_MMM_DD). Use underscores for spaces",
    requiresValue: true,
    valuePlaceholder: "Enter format (e.g., MM/DD/YYYY or MMM_DD)",
    allowedAfter: ["date"],
  },
  {
    key: "gen_rule",
    label: "Generation Rule",
    helper:
      "Custom generation rule with static text, dependencies (dep_FieldName), random parts (rn[12], rc[6]), repeats (<[5]), and fill (<[fill]). Use the interactive builder for best experience.",
    requiresValue: true,
    valuePlaceholder: "Click 'Build Rule' button to use interactive builder",
    allowedAfter: ["gen"],
  },
  {
    key: "mode",
    label: "Generation Mode",
    helper: "Set generation mode: mode[auto] for auto-generation on load and when dependencies change, or omit for manual generation only.",
    requiresValue: true,
    valuePlaceholder: "auto",
    allowedAfter: ["gen"],
  },
  {
    key: "grayscale",
    label: "Grayscale",
    helper: "Force grayscale rendering. Use on .upload/.file fields, or on .depends_ fields for independent grayscale. .grayscale for 100% or .grayscale_50 for custom intensity.",
    requiresValue: false, // Optional intensity
    valuePlaceholder: "Enter intensity (0-100, e.g., 80)",
    allowedAfter: ["upload", "file", "depends"],
  },
  {
    key: "hide_checked",
    label: "Hide Checked",
    helper: "Hide field when checked (visible by default)",
    allowedAfter: [
      "text", "textarea", "gen", "email", "number", "date", "checkbox",
      "upload", "tel", "password", "range", "color", "file", "status", "sign",
      "select", "editable", "max", "min", "tracking_id", "link", "date_format", "gen_rule"
    ],
  },
  {
    key: "hide_unchecked",
    label: "Hide Unchecked",
    helper: "Hide field when unchecked (hidden by default)",
    allowedAfter: [
      "text", "textarea", "gen", "email", "number", "date", "checkbox",
      "upload", "tel", "password", "range", "color", "file", "status", "sign",
      "select", "editable", "max", "min", "tracking_id", "link", "date_format", "gen_rule"
    ],
  },
  {
    key: "show_if",
    label: "Show If",
    helper: "Show this form field only when another field equals a specific value. Format: show_if_FieldId[Value] (e.g., show_if_Status[Error])",
    requiresValue: true,
    valuePlaceholder: "FieldId[Value] (e.g., Status[Error])",
    allowedAfter: [
      "text", "textarea", "gen", "email", "number", "date", "checkbox",
      "upload", "tel", "password", "range", "color", "file", "status", "sign",
      "editable", "max", "min", "tracking_id", "date_format", "gen_rule", "select",
    ],
  },
];

// Helper function to get all extensions that can come after a given field type
export function getAllowedExtensionsAfter(
  fieldType: string,
  currentExtensions: string[]
): ExtensionDefinition[] {
  // If no field type yet, return field types
  if (!fieldType) {
    return FIELD_TYPES;
  }

  // Check if we already have a field type
  const hasFieldType = FIELD_TYPES.some((ft) =>
    currentExtensions.some(ext => ext === ft.key || ext.startsWith(ft.key + "_"))
  );
  // depends_ satisfies the "needs a type" requirement
  const hasDepends = currentExtensions.some(ext => ext.startsWith("depends_"));

  if (!hasFieldType && !hasDepends) {
    // Still need a field type
    return FIELD_TYPES;
  }

  // After depends_, grayscale and track_ are allowed
  if (hasDepends && !hasFieldType) {
    return EXTENSIONS.filter(ext =>
      ext.allowedAfter?.includes("depends") &&
      !currentExtensions.some(e => e.startsWith(ext.key + "_") || e === ext.key)
    );
  }

  // Get the last extension to determine what can come next
  const lastExtension = currentExtensions[currentExtensions.length - 1];

  // Check if track_ is already present (must be last)
  if (currentExtensions.some((ext) => ext.startsWith("track_"))) {
    return []; // Nothing can come after track_
  }

  // Find what can come after the last extension
  const allowed: ExtensionDefinition[] = [];

  for (const ext of EXTENSIONS) {
    // Check if this extension is allowed after the last one
    if (ext.allowedAfter?.includes(lastExtension.split("_")[0])) {
      // Check if it's already present (except for max which can appear multiple times in some cases)
      if (
        !currentExtensions.some(
          (e) => e.startsWith(ext.key + "_") || e === ext.key
        )
      ) {
        allowed.push(ext);
      }
    }
  }

  return allowed;
}

// Helper function to parse ID into parts, robust against quoted links
export function parseId(id: string): { baseId: string; parts: string[]; url?: string } {
  if (!id) {
    return { baseId: "", parts: [] };
  }

  // 1. Extract link URL first to avoid splitting dots inside the URL
  let cleanId = id;
  let url: string | undefined;

  if (id.includes(".link_\"")) {
    const linkIndex = id.indexOf(".link_\"");
    const urlStart = linkIndex + 7;
    const urlEnd = id.indexOf("\"", urlStart);
    if (urlEnd !== -1) {
      url = id.substring(urlStart, urlEnd);
      cleanId = id.substring(0, linkIndex) + id.substring(urlEnd + 1);
    }
  } else if (id.includes(".link_")) {
    const linkIndex = id.indexOf(".link_");
    url = id.substring(linkIndex + 6);
    cleanId = id.substring(0, linkIndex);
  }

  const firstDotIndex = cleanId.indexOf(".");
  if (firstDotIndex === -1) {
    return { baseId: cleanId, parts: [], url };
  }

  const baseId = cleanId.substring(0, firstDotIndex);
  const rest = cleanId.substring(firstDotIndex + 1);
  const parts = rest.split(".").filter(p => p !== "");

  return { baseId, parts, url };
}

// Helper function to get suggestions based on current ID state
export function getSuggestions(id: string): ExtensionDefinition[] {
  const { baseId, parts } = parseId(id);

  // If no base ID yet, no suggestions
  if (!baseId) {
    return [];
  }

  // If no parts yet (just base ID), suggest field types
  if (parts.length === 0) {
    return FIELD_TYPES;
  }

  // Get the last part to determine what can come next
  const lastPart = parts[parts.length - 1];

  // Check if we have a field type yet (check extensions only)
  const fieldType = FIELD_TYPES.find((ft) => parts.some(p => p === ft.key || p.startsWith(ft.key + "_")));
  // depends_ also satisfies the "needs a type" requirement
  const hasDepends = parts.some(p => p.startsWith("depends_"));

  if (!fieldType && !hasDepends) {
    // Still need a field type - suggest field types
    return FIELD_TYPES;
  }

  // After depends_, grayscale and track_ are allowed — never suggest field types
  if (hasDepends && !fieldType) {
    const suggested: ExtensionDefinition[] = [];
    for (const ext of EXTENSIONS) {
      if (ext.allowedAfter?.includes("depends")) {
        const alreadyPresent = parts.some(p => p.startsWith(ext.key + "_") || p === ext.key);
        if (!alreadyPresent) suggested.push(ext);
      }
    }
    return suggested;
  }

  // Check if track_ is already present (must be last)
  if (parts.some((p) => p.startsWith("track_"))) {
    return []; // Nothing can come after track_
  }

  // Determine what can come after the last part
  const lastPartBase = lastPart.split("_")[0];
  const allowed: ExtensionDefinition[] = [];

  for (const ext of EXTENSIONS) {
    if (ext.allowedAfter?.includes(lastPartBase)) {
      // Check if it's already present
      const alreadyPresent = parts.some(
        (p) => p.startsWith(ext.key + "_") || p === ext.key
      );
      if (!alreadyPresent || (ext.key === "max" && fieldType?.key === "gen")) {
        allowed.push(ext);
      }
    }
  }

  return allowed;
}
