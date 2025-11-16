/**
 * Format a date according to a custom format string
 * 
 * Supported format codes:
 * - YYYY: Full year (2025)
 * - YY: Short year (25)
 * - MMMM: Full month name (January)
 * - MMM: Short month name (Jan)
 * - MM: Month with leading zero (01)
 * - M: Month without leading zero (1)
 * - DD: Day with leading zero (01)
 * - D: Day without leading zero (1)
 * - dddd: Full weekday (Monday)
 * - ddd: Short weekday (Mon)
 * - HH: 24-hour with zero (01, 23)
 * - H: 24-hour no zero (1, 23)
 * - hh: 12-hour with zero (01, 12)
 * - h: 12-hour no zero (1, 12)
 * - mm: Minutes with zero (01, 59)
 * - m: Minutes no zero (1, 59)
 * - ss: Seconds with zero (01, 59)
 * - s: Seconds no zero (1, 59)
 * - A: AM/PM uppercase
 * - a: am/pm lowercase
 */

export function formatDate(date: Date | string, format: string): string {
  // Convert string to Date if needed
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthNamesShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
  
  const dayNamesShort = [
    'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
  ];

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const dayOfWeek = d.getDay();
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  // Helper to pad with zero
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  // Use unique placeholders that won't conflict with any text
  // Use characters that won't appear in format strings or inserted text
  const placeholders: Record<string, string> = {};
  let counter = 0;
  const getPlaceholder = (key: string) => {
    if (!placeholders[key]) {
      // Use a unique marker that won't appear in dates or format strings
      placeholders[key] = `\u0001PH${counter++}\u0002`;
    }
    return placeholders[key];
  };
  
  let result = format;
  
  // Step 1: Replace single-character tokens with placeholders FIRST
  // Use word boundaries and negative lookahead to match only standalone tokens
  // Match M only if not part of MM, MMM, or MMMM
  result = result.replace(/(?<![M])M(?!M)/g, getPlaceholder('M'));
  // Match D only if not part of DD
  result = result.replace(/(?<![D])D(?!D)/g, getPlaceholder('D'));
  // Match H only if not part of HH
  result = result.replace(/(?<![H])H(?!H)/g, getPlaceholder('H'));
  // Match h only if not part of hh
  result = result.replace(/(?<![h])h(?!h)/g, getPlaceholder('h'));
  // Match m only if not part of mm
  result = result.replace(/(?<![m])m(?!m)/g, getPlaceholder('m'));
  // Match s only if not part of ss
  result = result.replace(/(?<![s])s(?!s)/g, getPlaceholder('s'));
  // Match A only if not part of AM (but we handle AM/PM separately)
  result = result.replace(/(?<![A])A(?!M)/g, getPlaceholder('A'));
  // Match a only if not part of am
  result = result.replace(/(?<![a])a(?!m)/g, getPlaceholder('a'));
  
  // Step 2: Replace multi-character tokens (safe, no conflicts)
  result = result.replace(/YYYY/g, year.toString());
  result = result.replace(/YY/g, year.toString().slice(-2));
  result = result.replace(/MMMM/g, monthNames[month]);
  result = result.replace(/MMM/g, monthNamesShort[month]);
  result = result.replace(/MM/g, pad(month + 1));
  result = result.replace(/DD/g, pad(day));
  result = result.replace(/dddd/g, dayNames[dayOfWeek]);
  result = result.replace(/ddd/g, dayNamesShort[dayOfWeek]);
  result = result.replace(/HH/g, pad(hours));
  const hours12 = hours % 12 || 12;
  result = result.replace(/hh/g, pad(hours12));
  result = result.replace(/mm/g, pad(minutes));
  result = result.replace(/ss/g, pad(seconds));
  
  // Step 3: Replace placeholders with actual values
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  if (placeholders['M']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['M']), 'g'), (month + 1).toString());
  }
  if (placeholders['D']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['D']), 'g'), day.toString());
  }
  if (placeholders['H']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['H']), 'g'), hours.toString());
  }
  if (placeholders['h']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['h']), 'g'), hours12.toString());
  }
  if (placeholders['m']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['m']), 'g'), minutes.toString());
  }
  if (placeholders['s']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['s']), 'g'), seconds.toString());
  }
  const ampm = hours >= 12 ? 'PM' : 'AM';
  if (placeholders['A']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['A']), 'g'), ampm);
  }
  if (placeholders['a']) {
    result = result.replace(new RegExp(escapeRegex(placeholders['a']), 'g'), ampm.toLowerCase());
  }

  // Replace underscores with spaces (after all token replacements)
  result = result.replace(/_/g, ' ');

  return result;
}


