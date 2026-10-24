import { describe, expect, it } from 'vitest';
import { formatDate, parseDate, usesUppercaseNames, toLocalIsoDate } from './dateFormatter';

const ymdhm = (d: Date | null) =>
  d && `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;

describe('parseDate', () => {
  it('reads day-first numeric dates with the format (no month/day swap)', () => {
    expect(ymdhm(parseDate('15/03/1990', 'DD/MM/YYYY'))).toBe('1990-3-15 0:0');
    expect(ymdhm(parseDate('05/03/1990', 'DD/MM/YYYY'))).toBe('1990-3-5 0:0');
    expect(ymdhm(parseDate('03/05/1990', 'MM/DD/YYYY'))).toBe('1990-3-5 0:0');
  });

  it('reads month names in any case and length (Jan, JAN, July, Sept)', () => {
    expect(ymdhm(parseDate('10 JAN 2025', 'DD_MMM_YYYY'))).toBe('2025-1-10 0:0');
    expect(ymdhm(parseDate('28 July 2025', 'DD_MMM_YYYY'))).toBe('2025-7-28 0:0');
    expect(ymdhm(parseDate('18 Sept 2025, 14:55 pm', 'D_MMM_YYYY__HH:mm'))).toBe('2025-9-18 14:55');
    expect(ymdhm(parseDate('January 5, 2025', 'MMMM_D,_YYYY'))).toBe('2025-1-5 0:0');
  });

  it('tolerates comma vs double-space separators between date and time', () => {
    expect(ymdhm(parseDate('13 Jun 2026, 04:07', 'D_MMM_YYYY__HH:mm'))).toBe('2026-6-13 4:7');
    expect(ymdhm(parseDate('4 Jun 2025  08:25', 'D_MMM_YYYY,_HH:mm'))).toBe('2025-6-4 8:25');
  });

  it('handles 12-hour clocks', () => {
    expect(ymdhm(parseDate('Jan 10, 2025 2:30 PM', 'MMM_DD,_YYYY_h:mm_A'))).toBe('2025-1-10 14:30');
    expect(ymdhm(parseDate('Jan 10, 2025 12:05 am', 'MMM_DD,_YYYY_h:mm_a'))).toBe('2025-1-10 0:5');
  });

  it('supports dotted formats and missing years', () => {
    expect(ymdhm(parseDate('15.03.1990', 'DD.MM.YYYY'))).toBe('1990-3-15 0:0');
    expect(parseDate('Jan 10', 'MMM_DD')?.getFullYear()).toBe(new Date().getFullYear());
  });

  it('treats ISO dates as local, and refuses ambiguous numbers without a format', () => {
    expect(ymdhm(parseDate('1990-03-15'))).toBe('1990-3-15 0:0');
    expect(parseDate('05/03/1990')).toBeNull();
    expect(parseDate('31/02/2025', 'DD/MM/YYYY')).toBeNull();
    expect(parseDate('', 'DD/MM/YYYY')).toBeNull();
  });
});

describe('formatDate', () => {
  const d = new Date(2025, 0, 5, 14, 3, 9);

  it('formats every token', () => {
    expect(formatDate(d, 'YYYY YY MMMM MMM MM M DD D dddd ddd')).toBe('2025 25 January Jan 01 1 05 5 Sunday Sun');
    expect(formatDate(d, 'HH:mm:ss H:m:s hh h A a')).toBe('14:03:09 14:3:9 02 2 PM pm');
  });

  it('keeps month names intact (no token re-replacement inside "March"/"May")', () => {
    expect(formatDate(new Date(2025, 2, 1), 'MMMM D')).toBe('March 1');
    expect(formatDate(new Date(2025, 4, 1), 'D MMM YYYY')).toBe('1 May 2025');
  });

  it('turns underscores into spaces and keeps [literal] text', () => {
    expect(formatDate(d, 'D_MMM_YYYY,_HH:mm')).toBe('5 Jan 2025, 14:03');
    expect(formatDate(d, 'MMM D [at] h:mm a')).toBe('Jan 5 at 2:03 pm');
  });

  it('can write capital month names', () => {
    expect(formatDate(d, 'DD MMM YYYY', { uppercase: true })).toBe('05 JAN 2025');
  });

  it('round-trips a formatted string', () => {
    for (const fmt of ['DD/MM/YYYY', 'D_MMM_YYYY,_HH:mm', 'MMMM_D,_YYYY', 'MM/DD/YYYY_h:mm_A', 'DD.MM.YYYY']) {
      expect(formatDate(formatDate(d, fmt), fmt)).toBe(formatDate(d, fmt));
    }
  });
});

describe('helpers', () => {
  it('detects capitalised month samples', () => {
    expect(usesUppercaseNames('10 JAN 2025')).toBe(true);
    expect(usesUppercaseNames('10 Jan 2025')).toBe(false);
    expect(usesUppercaseNames('JOHN 10/01/2025')).toBe(false);
  });

  it('builds a local YYYY-MM-DD', () => {
    expect(toLocalIsoDate(new Date(1990, 2, 15, 0, 30))).toBe('1990-03-15');
  });
});

describe('two-digit years', () => {
  it('reads near-future years as 20xx and the rest as 19xx', () => {
    const yy = new Date().getFullYear() % 100;
    expect(parseDate('01/01/40', 'DD/MM/YY')?.getFullYear()).toBe(1940);
    expect(parseDate(`01/01/${String(yy + 5).padStart(2, '0')}`, 'DD/MM/YY')?.getFullYear()).toBe(2000 + yy + 5);
    expect(parseDate('01/01/90', 'DD/MM/YY')?.getFullYear()).toBe(1990);
  });
});

describe('native fallback', () => {
  it('rejects junk without a full year', () => {
    expect(parseDate('Ma 10')).toBeNull();
    expect(parseDate('March 5, 2025')?.getDate()).toBe(5);
  });
});
