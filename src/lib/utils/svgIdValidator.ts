import { FIELD_TYPES, EXTENSIONS } from "@/components/Admin/ToolBuilder/SvgEditor/idExtensions";

/**
 * SVG ID Validation Engine
 * 
 * Formal Structure: [base_id].[type].[extension_1].[extension_2]...[track_role]
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  parts: string[];
  baseId: string;
}

/**
 * Validates an SVG ID string against our formal DSL.
 * VS Code / IDE Grade experience.
 */
export function validateSvgId(id: string): ValidationResult {
  if (!id) {
    return { valid: false, error: "ID cannot be empty", parts: [], baseId: "" };
  }

  // Extract link URL before splitting (URLs contain dots)
  let cleanId = id;
  if (id.includes(".link_")) {
     cleanId = id.substring(0, id.indexOf(".link_") + 6); // Keep '.link_' prefix for validation
  }

  // 1. Mandatory Extension Rule
  if (!cleanId.includes(".")) {
    return { 
      valid: false, 
      error: "💡 Add '.text' or another extension to make this an editable field!", 
      parts: [], 
      baseId: cleanId 
    };
  }

  const parts = cleanId.split(".");
  const baseId = parts[0];

  // 2. Validate Base ID
  if (!baseId) {
    return { valid: false, error: "Base ID (before the first dot) cannot be empty", parts, baseId };
  }

  // 3. Check for empty segments (double dots)
  if (parts.some(p => p === "")) {
    return { valid: false, error: "ID contains empty segments (double dots)", parts, baseId };
  }

  let typeCount = 0;
  let lastPartBase = "";

  // 4. Whitelist & Syntax Enforcement
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const partBase = part.split("_")[0];
    let isWhitelisted = false;

    // A. Check Field Types
    const fieldType = FIELD_TYPES.find(ft => ft.key === partBase);
    if (fieldType) {
      isWhitelisted = true;
      typeCount++;

      // Field types must come first (after base ID)
      if (i !== 1) {
          return { valid: false, error: `❌ Field type '.${partBase}' must come immediately after the base ID.`, parts, baseId };
      }
    }

    // B. Check Extensions
    const extension = EXTENSIONS.find(ext => ext.key === partBase);
    if (extension) {
      isWhitelisted = true;

      // Check allowedAfter
      if (lastPartBase) {
          const isAllowedAfter = extension.allowedAfter?.includes(lastPartBase);
          if (!isAllowedAfter) {
              return { valid: false, error: `❌ Extension '.${partBase}' is not allowed after '.${lastPartBase}'.`, parts, baseId };
          }
      } else {
          // This should only happen if first part (i=1) is an extension, 
          // but we expect a field type first usually.
          // However, some extensions might be allowed directly if they behave like types.
          // For now, let's enforce type first or use a default.
          if (i === 1 && !fieldType) {
               // If no field type at index 1, check if this extension can start an ID
               // (Technically our grammar usually wants a type first)
          }
      }

      // Check for duplicates
      if (parts.slice(1, i).some(p => p.split("_")[0] === partBase)) {
          return { valid: false, error: `❌ Duplicate extension '.${partBase}' not allowed.`, parts, baseId };
      }

      // Check mustBeLast
      if (extension.mustBeLast && i !== parts.length - 1) {
          return { valid: false, error: `⚠️ Move '.${part}' to the very end of the ID.`, parts, baseId };
      }
    }

    // C. Special case for legacy track_ (if not in EXTENSIONS)
    if (!isWhitelisted && part.startsWith("track_")) {
        isWhitelisted = true;
        if (i !== parts.length - 1) {
            return { valid: false, error: `⚠️ Move '.${part}' to the very end of the ID.`, parts, baseId };
        }
    }

    if (!isWhitelisted) {
        return { valid: false, error: `❌ '.${part}' is not a valid extension.`, parts, baseId };
    }

    const def = fieldType || extension;
    if (def?.requiresValue) {
        if (part === partBase || part === partBase + "_") {
            return { valid: false, error: `✍️ Add a value for '${partBase}' (e.g., .${partBase}_value).`, parts, baseId };
        }
    }

    // Missing Values (e.g. .max_) - Catch-all for extensions that end with underscore but maybe aren't defined with requiresValue
    if (part.endsWith("_") && !part.startsWith("track_")) {
        return { valid: false, error: `✍️ Add a value after '${part.slice(0, -1)}' (e.g., .${part}50).`, parts, baseId };
    }

    lastPartBase = partBase;
  }

  // 5. Unique Type Rule
  if (typeCount > 1) {
      return { valid: false, error: "Too many field types. Pick one: .text, .textarea, .upload, etc.", parts, baseId };
  }
  
  // 6. Ensure at least one field type if extensions are present
  if (typeCount === 0 && parts.length > 1) {
      // Logic: if there's no explicit field type, it's treated as .text by default in parsers,
      // but strictly speaking, we want explicit IDs.
      // However, for backward compatibility, we might allow it.
      // Let's be helpful:
      // return { valid: false, error: "💡 Missing field type. Did you forget '.text'?", parts, baseId };
  }

  return { valid: true, parts, baseId };
}
