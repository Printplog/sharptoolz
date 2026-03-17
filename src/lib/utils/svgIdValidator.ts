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

  // Extract link URL before splitting (URLs contain dots and special chars)
  let cleanId = id;
  let hasLinkWithUrl = false;
  if (id.includes(".link_")) {
    const linkIndex = id.indexOf(".link_");
    const linkValue = id.substring(linkIndex + 6); // URL after '.link_'
    hasLinkWithUrl = linkValue.length > 0; // Must have URL after .link_
    cleanId = id.substring(0, linkIndex); // Remove .link_ and URL for validation
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
    let isWhitelisted = false;

    // Check if this is a flag extension (no underscore suffix needed)
    // Examples: "tracking_id", "editable", "hide_checked", "hide_unchecked"
    const isFlagExtension = EXTENSIONS.some(ext => ext.key.toLowerCase() === part.toLowerCase());

    // For non-flag extensions, extract the base (e.g., "max_50" → "max")
    const partBase = isFlagExtension ? part : part.split("_")[0];

    // A. Check Field Types
    const fieldType = FIELD_TYPES.find(ft => ft.key.toLowerCase() === partBase.toLowerCase());
    if (fieldType) {
      isWhitelisted = true;
      typeCount++;

      // Field types must come first (after base ID)
      if (i !== 1) {
        return { valid: false, error: `❌ Field type '.${partBase}' must come immediately after the base ID.`, parts, baseId };
      }
    }

    // B. Check Extensions
    // For flag extensions, match the full part; for others, match the base
    const extension = EXTENSIONS.find(ext =>
      isFlagExtension
        ? ext.key.toLowerCase() === part.toLowerCase()
        : ext.key.toLowerCase() === partBase.toLowerCase()
    );
    if (extension) {
      isWhitelisted = true;

      // Check allowedAfter
      if (lastPartBase) {
        const isAllowedAfter = extension.allowedAfter?.includes(lastPartBase);
        if (!isAllowedAfter) {
          return { valid: false, error: `❌ Extension '.${part}' is not allowed after '.${lastPartBase}'.`, parts, baseId };
        }
      }

      // Check for duplicates
      if (isFlagExtension) {
        if (parts.slice(1, i).some(p => p.toLowerCase() === part.toLowerCase())) {
          return { valid: false, error: `❌ Duplicate extension '.${part}' not allowed.`, parts, baseId };
        }
      } else {
        if (parts.slice(1, i).some(p => p.split("_")[0] === partBase)) {
          return { valid: false, error: `❌ Duplicate extension '.${partBase}' not allowed.`, parts, baseId };
        }
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

  // 7. Validate link extension has URL
  if (id.includes(".link_") && !hasLinkWithUrl) {
    return { valid: false, error: "✍️ Add a URL after '.link_' (e.g., .link_https://example.com).", parts, baseId };
  }

  return { valid: true, parts, baseId };
}
