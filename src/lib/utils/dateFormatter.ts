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
  
  // Replace tokens in order (longest first to avoid conflicts)
  let result = format;
  
  // AM/PM - Replace BEFORE month names to avoid matching "A" in "Aug", "Apr", etc.
  const ampm = hours >= 12 ? 'PM' : 'AM';
  // Use a placeholder to temporarily replace AM/PM tokens
  const ampmPlaceholder = '___AMPM___';
  result = result.replace(/A/g, ampmPlaceholder);
  result = result.replace(/a/g, ampmPlaceholder.toLowerCase());
  
  // Year
  result = result.replace(/YYYY/g, year.toString());
  result = result.replace(/YY/g, year.toString().slice(-2));
  
  // Month
  result = result.replace(/MMMM/g, monthNames[month]);
  result = result.replace(/MMM/g, monthNamesShort[month]);
  result = result.replace(/MM/g, pad(month + 1));
  result = result.replace(/M/g, (month + 1).toString());
  
  // Day
  result = result.replace(/DD/g, pad(day));
  result = result.replace(/D/g, day.toString());
  
  // Weekday
  result = result.replace(/dddd/g, dayNames[dayOfWeek]);
  result = result.replace(/ddd/g, dayNamesShort[dayOfWeek]);
  
  // Hours (24-hour)
  result = result.replace(/HH/g, pad(hours));
  result = result.replace(/H/g, hours.toString());
  
  // Hours (12-hour)
  const hours12 = hours % 12 || 12;
  result = result.replace(/hh/g, pad(hours12));
  result = result.replace(/h/g, hours12.toString());
  
  // Minutes
  result = result.replace(/mm/g, pad(minutes));
  result = result.replace(/m/g, minutes.toString());
  
  // Seconds
  result = result.replace(/ss/g, pad(seconds));
  result = result.replace(/s/g, seconds.toString());
  
  // Replace AM/PM placeholder with actual value
  result = result.replace(new RegExp(ampmPlaceholder, 'g'), ampm);
  result = result.replace(new RegExp(ampmPlaceholder.toLowerCase(), 'g'), ampm.toLowerCase());

  // Replace underscores with spaces (after all token replacements)
  result = result.replace(/_/g, ' ');

  return result;
}


