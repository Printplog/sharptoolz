/**
 * Extract form fields from SVG elements for preview
 * Uses current element values (from admin edits) instead of SVG content
 */

import type { FormField } from "@/types";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

/**
 * Extract form fields from elements with current values from element state (not SVG)
 * This ensures admin edits are reflected immediately in preview
 */
export function extractFormFieldsFromElements(
  elements: SvgElement[]
): FormField[] {
  return elements
    .filter(el => el.tag === 'text' && el.id)
    .map(el => {
      // Use current text from element state (admin edits), fallback to innerText
      // This ensures preview shows current edits, not saved SVG content
      const currentText = el.innerText || '';
      
      // Extract base ID (field name)
      const baseId = el.id?.split('.')[0] || '';
      
      // Determine field type from ID extensions
      let type: FormField['type'] = 'text';
      if (el.id?.includes('.gen')) {
        type = 'text'; // Gen fields are still text type but have generationRule
      } else if (el.id?.includes('.email')) {
        type = 'email';
      } else if (el.id?.includes('.number')) {
        type = 'number';
      } else if (el.id?.includes('.checkbox')) {
        type = 'checkbox';
      }
      
      // Extract max/min from ID
      const maxMatch = el.id?.match(/max_(\d+)/);
      const minMatch = el.id?.match(/min_(\d+)/);
      
      // Extract generation rule from gen_ extension
      // Format: FieldName.gen_RULE.max_50 or FieldName.gen_RULE
      // Need to capture everything after gen_ until the next extension (starts with .) or end
      let generationRule: string | undefined;
      if (el.id?.includes('.gen_')) {
        // Find the gen_ part and extract everything after it until next dot or end
        const genIndex = el.id.indexOf('.gen_');
        if (genIndex !== -1) {
          const afterGen = el.id.substring(genIndex + 5); // +5 for '.gen_'
          // Find the next extension (starts with dot followed by a known extension prefix)
          // Or take everything to the end
          const extensionPatterns = ['max_', 'min_', 'editable', 'track', 'link', 'date_format', 'mode', 'hide_', 'grayscale', 'select_', 'depends_', 'tracking_id', 'text', 'email', 'number', 'checkbox', 'gen_', 'date'];
          let nextExtIndex = -1;
          for (const pattern of extensionPatterns) {
            const index = afterGen.indexOf(`.${pattern}`);
            if (index !== -1 && (nextExtIndex === -1 || index < nextExtIndex)) {
              nextExtIndex = index;
            }
          }
          if (nextExtIndex !== -1) {
            generationRule = afterGen.substring(0, nextExtIndex);
          } else {
            // No next extension, take everything
            generationRule = afterGen;
          }
        }
      }
      
      // Extract generation mode (auto)
      let generationMode: string | undefined;
      const modeMatch = el.id?.match(/mode\[(\w+)\]/);
      if (modeMatch) {
        generationMode = modeMatch[1];
      }
      
      // Extract dependsOn
      let dependsOn: string | undefined;
      if (el.id?.includes('.depends_')) {
        const dependsMatch = el.id.match(/depends_(\w+)/);
        if (dependsMatch) {
          dependsOn = dependsMatch[1];
        }
      }
      
      // Extract date format
      let dateFormat: string | undefined;
      const dateFormatMatch = el.id?.match(/date_format\[(.+?)\]/);
      if (dateFormatMatch) {
        dateFormat = dateFormatMatch[1];
      }
      
      return {
        id: baseId,
        name: baseId.replace(/_/g, ' '),
        type,
        defaultValue: currentText,
        currentValue: currentText, // Use current element value from admin edits
        required: false,
        max: maxMatch ? parseInt(maxMatch[1]) : undefined,
        min: minMatch ? parseInt(minMatch[1]) : undefined,
        options: undefined,
        helperText: '',
        editable: !el.id?.includes('.editable_false'),
        generationRule,
        generationMode,
        dependsOn,
        dateFormat,
      };
    });
}

