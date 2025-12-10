/**
 * Extract value from a field based on dependency pattern
 * 
 * Supports:
 * - field_name - Copy entire value
 * - field_name[w1] - Extract first word
 * - field_name[w2] - Extract second word
 * - field_name[ch1] - Extract first character
 * - field_name[ch1,2,5] - Extract specific characters (1st, 2nd, 5th)
 * - field_name[ch1-4] - Extract character range (1st to 4th)
 * 
 * For image and signature fields, extraction patterns are ignored and the full value is returned
 */

export function extractFromDependency(
  dependsOn: string, 
  allFields: Record<string, string | number | boolean | any>
): string {
  // Check if pattern contains extraction syntax
  const extractMatch = dependsOn.match(/^(.+)\[(w|ch)(.+)\]$/);
  
  if (extractMatch) {
    const fieldName = extractMatch[1];
    const extractType = extractMatch[2]; // 'w' or 'ch'
    const extractPattern = extractMatch[3]; // '1', '1,2,5', '1-4'
    
    const fieldValue = allFields[fieldName];
    
    // For image and signature fields, ignore extraction patterns and return the full value
    if (fieldValue && (typeof fieldValue === 'string' && (fieldValue.startsWith('data:image/') || fieldValue.startsWith('blob:')))) {
      return fieldValue;
    }
    
    const stringValue = String(fieldValue || '');
    
    if (extractType === 'w') {
      // Word extraction
      return extractWord(stringValue, extractPattern);
    } else if (extractType === 'ch') {
      // Character extraction
      return extractChars(stringValue, extractPattern);
    }
  }
  
  // Simple field reference (no extraction)
  const baseFieldName = dependsOn.split('[')[0];
  const fieldValue = allFields[baseFieldName];
  
  // For image and signature fields, return the full value
  if (fieldValue && (typeof fieldValue === 'string' && (fieldValue.startsWith('data:image/') || fieldValue.startsWith('blob:')))) {
    return fieldValue;
  }
  
  return String(fieldValue || '');
}

function extractWord(text: string, pattern: string): string {
  const words = text.trim().split(/\s+/);
  const wordIndex = parseInt(pattern) - 1; // Convert to 0-based index
  
  return words[wordIndex] || '';
}

function extractChars(text: string, pattern: string): string {
  // Handle comma-separated: ch1,2,5
  if (pattern.includes(',')) {
    const indices = pattern.split(',').map(i => parseInt(i.trim()) - 1);
    return indices.map(i => text[i] || '').join('');
  }
  
  // Handle range: ch1-4
  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(i => parseInt(i.trim()));
    return text.slice(start - 1, end);
  }
  
  // Handle single character: ch1
  const index = parseInt(pattern) - 1;
  return text[index] || '';
}

