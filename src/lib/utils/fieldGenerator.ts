/**
 * Generate values based on generation rules
 * 
 * Supports:
 * - (rn[12]) - Random 12 numbers
 * - (rc[6]) - Random 6 letters
 * - FL(rn[12]) - Prefix + random numbers
 * - (rn[6])(rc[6]) - Mixed: numbers + letters
 * - (A[10]) - Duplicate character 10 times
 * - (field_name) - Copy from another field
 * - (dep_FieldName) - Copy from another field (dependency syntax)
 * - (field_name[w1]) - Extract first word
 * - (dep_FieldName[w1]) - Extract first word from dependency
 * - (field_name[ch1-4]) - Extract characters 1-4
 * - (dep_FieldName[ch1-4]) - Extract characters 1-4 from dependency
 * - (<[fill]) - Fill with character to reach max length (requires maxLength parameter)
 */

export function generateValue(
  generationRule: string, 
  allFields?: Record<string, string | number | boolean>,
  maxLength?: number
): string {
  // Extract all generation patterns (text)...(text)
  const patterns = generationRule.match(/([^()]+|\([^)]+\))/g) || [];
  
  // First pass: identify fill patterns and process others
  const fillPatterns: Array<{ index: number; char: string; placeholder: string }> = [];
  const parts: Array<{ type: 'static' | 'generated' | 'fill'; value: string; fillChar?: string }> = [];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (pattern.startsWith('(') && pattern.endsWith(')')) {
      // This is a generation pattern
      const content = pattern.slice(1, -1); // Remove parentheses
      
      // Check if it's a fill pattern
      const fillMatch = content.match(/^(.+?)\[fill\]$/);
      if (fillMatch && maxLength !== undefined) {
        // Store fill pattern for later processing
        const fillChar = fillMatch[1] || '<'; // Default to '<' if empty
        const placeholder = `__FILL_${i}__`;
        fillPatterns.push({ index: i, char: fillChar, placeholder });
        parts.push({ type: 'fill', value: placeholder, fillChar: fillChar });
      } else {
        const generated = processGenerationPattern(content, allFields);
        parts.push({ type: 'generated', value: generated });
      }
    } else {
      // This is static text (prefix/suffix)
      parts.push({ type: 'static', value: pattern });
    }
  }
  
  // Build result without fill
  let resultWithoutFill = parts
    .filter(p => p.type !== 'fill')
    .map(p => p.value)
    .join('');
  
  // Calculate fill needed
  let fillNeeded = 0;
  if (fillPatterns.length > 0 && maxLength !== undefined) {
    fillNeeded = Math.max(0, maxLength - resultWithoutFill.length);
    }
  
  // Build final result with fill
  let result = '';
  for (const part of parts) {
    if (part.type === 'fill') {
      // Apply fill (only the last fill pattern gets all the fill if multiple exist)
      const isLastFill = part === parts.filter(p => p.type === 'fill').pop();
      const fillAmount = isLastFill ? fillNeeded : 0;
      result += (part.fillChar || '<').repeat(fillAmount);
    } else {
      result += part.value;
    }
  }
  
  // Enforce max length (truncate if needed)
  if (maxLength !== undefined && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }
  
  return result;
}

function processGenerationPattern(pattern: string, allFields?: Record<string, string | number | boolean>): string {
  // Random numbers: rn[12]
  if (pattern.startsWith('rn[') && pattern.endsWith(']')) {
    const count = parseInt(pattern.match(/\d+/)?.[0] || '0');
    return generateRandomNumbers(count);
  }
  
  // Random characters: rc[6] (mixed), ru[6] (uppercase), rl[6] (lowercase)
  if (pattern.match(/^(rc|ru|rl)\[/) && pattern.endsWith(']')) {
    const match = pattern.match(/^(rc|ru|rl)\[(\d+)\]$/);
    if (match) {
      const kind = match[1] as 'rc' | 'ru' | 'rl';
      const count = parseInt(match[2] || '0');
      return generateRandomChars(count, kind);
  }
  }
  
  // Random both (numbers + letters): rb[6] with case option
  // This is handled by combining rn and rc/ru/rl patterns
  
  // Character duplication: A[10]
  const dupMatch = pattern.match(/^(.+)\[(\d+)\]$/);
  if (dupMatch) {
    const char = dupMatch[1];
    const count = parseInt(dupMatch[2]);
    
    // Check if it's a field reference
    if (allFields && allFields[char]) {
      return String(allFields[char]).repeat(count);
    }
    
    // Otherwise duplicate the character
    return char.repeat(count);
  }
  
  // Field reference with extraction: field_name[w1] or field_name[ch1-4]
  if (allFields) {
    return extractFromField(pattern, allFields);
  }
  
  return '';
}

function generateRandomNumbers(count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
}

function generateRandomChars(count: number, kind: 'rc' | 'ru' | 'rl' = 'rc'): string {
  let chars: string;
  if (kind === 'ru') {
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  } else if (kind === 'rl') {
    chars = 'abcdefghijklmnopqrstuvwxyz';
  } else {
    // rc - mixed case
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  }
  
  let result = '';
  for (let i = 0; i < count; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function extractFromField(pattern: string, allFields: Record<string, string | number | boolean>): string {
  // Check if pattern contains extraction syntax
  const extractMatch = pattern.match(/^(dep_)?(.+?)(\[(w|ch)(.+)\])?$/);
  
  if (extractMatch) {
    const hasDep = !!extractMatch[1]; // 'dep_' prefix
    const fieldName = extractMatch[2]; // Field name without dep_ prefix
    const extractType = extractMatch[4]; // 'w' or 'ch'
    const extractPattern = extractMatch[5]; // '1', '1,2,5', '1-4'
    
    // Get field value (try with and without dep_ prefix)
    let fieldValue = '';
    if (hasDep) {
      // Try exact match first, then try without dep_ prefix
      fieldValue = String(allFields[`dep_${fieldName}`] || allFields[fieldName] || '');
    } else {
      fieldValue = String(allFields[fieldName] || '');
    }
    
    if (extractType === 'w') {
      // Word extraction
      return extractWord(fieldValue, extractPattern);
    } else if (extractType === 'ch') {
      // Character extraction
      return extractChars(fieldValue, extractPattern);
    }
    
    // Simple field reference (no extraction)
    return fieldValue;
  }
  
  // Fallback: try direct field reference
  return String(allFields[pattern] || allFields[pattern.replace(/^dep_/, '')] || '');
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

/**
 * Apply max generation padding
 * Example: value="123", maxGeneration="(A[10])" → "123AAAAAAA"
 */
export function applyMaxGeneration(value: string, maxGeneration: string): string {
  const pattern = maxGeneration.slice(1, -1); // Remove parentheses
  const match = pattern.match(/^(.+)\[(\d+)\]$/);
  
  if (match) {
    const char = match[1];
    const maxLength = parseInt(match[2]);
    const currentLength = value.length;
    const paddingNeeded = Math.max(0, maxLength - currentLength);
    
    return value + char.repeat(paddingNeeded);
  }
  
  return value;
}

