/**
 * Format and parse dates using a custom format string
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
 *
 * Underscores become spaces. Wrap literal text in brackets, e.g. "MMM D [at] h:mm A".
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const TOKENS = [
  'YYYY', 'YY', 'MMMM', 'MMM', 'MM', 'M', 'DD', 'D', 'dddd', 'ddd',
  'HH', 'H', 'hh', 'h', 'mm', 'm', 'ss', 's', 'A', 'a'
] as const;

type Token = typeof TOKENS[number];
type Part = { token: Token } | { literal: string };

export type DateFormatOptions = {
  /** Render month and weekday names in capitals (JAN, MON) */
  uppercase?: boolean;
};

/** Split a format string into tokens and literal text (longest token wins). */
function tokenize(format: string): Part[] {
  const parts: Part[] = [];
  let i = 0;
  const pushLiteral = (text: string) => {
    const last = parts[parts.length - 1];
    if (last && 'literal' in last) last.literal += text;
    else parts.push({ literal: text });
  };

  while (i < format.length) {
    const ch = format[i];
    if (ch === '[') {
      const end = format.indexOf(']', i + 1);
      if (end !== -1) {
        pushLiteral(format.slice(i + 1, end));
        i = end + 1;
        continue;
      }
    }
    const token = TOKENS.find((t) => format.startsWith(t, i));
    if (token) {
      parts.push({ token });
      i += token.length;
    } else {
      pushLiteral(ch === '_' ? ' ' : ch);
      i += 1;
    }
  }
  return parts;
}

export function formatDate(date: Date | string, format: string, options: DateFormatOptions = {}): string {
  const d = typeof date === 'string' ? parseDate(date, format) : date;

  if (!d || isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const hours = d.getHours();
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const pad = (num: number) => num.toString().padStart(2, '0');
  const name = (value: string) => (options.uppercase ? value.toUpperCase() : value);

  const values: Record<Token, () => string> = {
    YYYY: () => year.toString(),
    YY: () => year.toString().slice(-2),
    MMMM: () => name(MONTH_NAMES[month]),
    MMM: () => name(MONTH_NAMES[month].slice(0, 3)),
    MM: () => pad(month + 1),
    M: () => (month + 1).toString(),
    DD: () => pad(day),
    D: () => day.toString(),
    dddd: () => name(DAY_NAMES[d.getDay()]),
    ddd: () => name(DAY_NAMES[d.getDay()].slice(0, 3)),
    HH: () => pad(hours),
    H: () => hours.toString(),
    hh: () => pad(hours12),
    h: () => hours12.toString(),
    mm: () => pad(d.getMinutes()),
    m: () => d.getMinutes().toString(),
    ss: () => pad(d.getSeconds()),
    s: () => d.getSeconds().toString(),
    A: () => ampm,
    a: () => ampm.toLowerCase(),
  };

  return tokenize(format)
    .map((part) => ('literal' in part ? part.literal : values[part.token]()))
    .join('');
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const TOKEN_PATTERNS: Record<Token, string> = {
  YYYY: '(\\d{4})',
  YY: '(\\d{2})',
  MMMM: '([A-Za-z]{3,})\\.?',
  MMM: '([A-Za-z]{3,})\\.?',
  MM: '(\\d{1,2})',
  M: '(\\d{1,2})',
  DD: '(\\d{1,2})',
  D: '(\\d{1,2})',
  dddd: '[A-Za-z]+\\.?',
  ddd: '[A-Za-z]+\\.?',
  HH: '(\\d{1,2})',
  H: '(\\d{1,2})',
  hh: '(\\d{1,2})',
  h: '(\\d{1,2})',
  mm: '(\\d{1,2})',
  m: '(\\d{1,2})',
  ss: '(\\d{1,2})',
  s: '(\\d{1,2})',
  A: '([AaPp]\\.?[Mm]\\.?)',
  a: '([AaPp]\\.?[Mm]\\.?)',
};

function monthFromName(text: string): number {
  const lower = text.toLowerCase();
  // Accepts "Jan", "January", "Sept", etc.
  return MONTH_NAMES.findIndex((m) => m.toLowerCase().startsWith(lower) && lower.length >= 3);
}

// Be forgiving about spacing and commas between components, so "4 Jun 2025, 08:25"
// still reads with "D MMM YYYY  HH:mm"
function literalPattern(literal: string): string {
  if (/^[\s,]+$/.test(literal)) return '[\\s,]+';
  return literal
    .split(/(\s+)/)
    .map((chunk) => (/^\s+$/.test(chunk) ? '\\s+' : escapeRegex(chunk).replace(/,/g, ',?')))
    .join('');
}

function parseWithFormat(value: string, format: string): Date | null {
  const parts = tokenize(format);
  const groups: Token[] = [];
  let pattern = '';
  for (const part of parts) {
    if ('literal' in part) {
      pattern += literalPattern(part.literal);
    } else {
      pattern += TOKEN_PATTERNS[part.token];
      if (TOKEN_PATTERNS[part.token].startsWith('(')) groups.push(part.token);
    }
  }

  // Allow trailing extras such as a stray "pm" after a 24-hour time
  const match = new RegExp(`^\\s*${pattern}`, 'i').exec(value);
  if (!match) return null;

  const now = new Date();
  let year = now.getFullYear();
  let month = 0;
  let day = 1;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let meridiem: 'AM' | 'PM' | null = null;
  let twelveHour = false;

  groups.forEach((token, index) => {
    const raw = match[index + 1];
    const num = parseInt(raw, 10);
    switch (token) {
      case 'YYYY': year = num; break;
      // Up to 10 years ahead reads as 20xx (expiry dates), anything later as 19xx (birth dates)
      case 'YY': year = num + (num > (now.getFullYear() % 100) + 10 ? 1900 : 2000); break;
      case 'MMMM':
      case 'MMM': month = monthFromName(raw); break;
      case 'MM':
      case 'M': month = num - 1; break;
      case 'DD':
      case 'D': day = num; break;
      case 'HH':
      case 'H': hours = num; break;
      case 'hh':
      case 'h': hours = num; twelveHour = true; break;
      case 'mm':
      case 'm': minutes = num; break;
      case 'ss':
      case 's': seconds = num; break;
      case 'A':
      case 'a': meridiem = raw.toLowerCase().startsWith('p') ? 'PM' : 'AM'; break;
    }
  });

  // A trailing am/pm that the format doesn't mention (e.g. "14:55 pm")
  if (!meridiem) {
    const rest = value.slice(match[0].length).trim().toLowerCase();
    if (/^p\.?m\.?$/.test(rest)) meridiem = 'PM';
    else if (/^a\.?m\.?$/.test(rest)) meridiem = 'AM';
  }

  if (meridiem && (twelveHour || hours <= 12)) {
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  if (month < 0 || month > 11 || day < 1 || day > 31 || hours > 23 || minutes > 59 || seconds > 59) {
    return null;
  }

  const result = new Date(year, month, day, hours, minutes, seconds);
  // Reject roll-overs like 31 Feb
  if (result.getMonth() !== month || result.getDate() !== day) return null;
  return result;
}

/**
 * Parse a date string, preferring the given format so day/month order and
 * month names are read correctly. Falls back to ISO and native parsing.
 * Returns null when the value can't be understood.
 */
export function parseDate(value: string, format?: string): Date | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();

  if (format) {
    const parsed = parseWithFormat(trimmed, format);
    if (parsed) return parsed;
  }

  // ISO date-only strings are treated as local dates (not UTC midnight)
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (iso) {
    const [, y, mo, da, h = '0', mi = '0', se = '0'] = iso;
    const d = new Date(+y, +mo - 1, +da, +h, +mi, +se);
    return isNaN(d.getTime()) ? null : d;
  }

  // Ambiguous numeric dates (01/02/2025) are only trusted via the format above
  if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/.test(trimmed)) return null;

  // Native parsing guesses wildly ("Ma 10" -> 2001), so only trust it with a full year
  if (!/\b\d{4}\b/.test(trimmed)) return null;
  const native = new Date(trimmed);
  return isNaN(native.getTime()) ? null : native;
}

/** True when a sample value writes month/weekday names in capitals (e.g. "10 JAN 2025"). */
export function usesUppercaseNames(sample: unknown): boolean {
  if (typeof sample !== 'string') return false;
  const words = sample.match(/[A-Za-z]{3,}/g) || [];
  return words.some((word) => {
    if (word !== word.toUpperCase()) return false;
    const lower = word.toLowerCase();
    return MONTH_NAMES.some((m) => m.toLowerCase().startsWith(lower)) ||
      DAY_NAMES.some((d) => d.toLowerCase().startsWith(lower));
  });
}

/** Local YYYY-MM-DD (toISOString shifts the day in non-UTC timezones). */
export function toLocalIsoDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
