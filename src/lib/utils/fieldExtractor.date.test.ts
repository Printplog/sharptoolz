import { describe, expect, it } from 'vitest';
import { extractFromDependency, dateFormatsOf } from './fieldExtractor';

describe('date dependencies read the source field format', () => {
  const formats = dateFormatsOf([{ id: 'DOB', dateFormat: 'DD/MM/YYYY' }, { id: 'Trip', dateFormat: 'D_MMM_YYYY,_HH:mm' }]);

  it('does not swap day and month of a DD/MM/YYYY source', () => {
    expect(extractFromDependency('DOB[date:yyyy-MM-dd]', { DOB: '05/03/2025' }, formats)).toBe('2025-03-05');
    expect(extractFromDependency('DOB[date:dd MMM yyyy]', { DOB: '13/03/2025' }, formats)).toBe('13 Mar 2025');
  });

  it('reads month-name sources', () => {
    expect(extractFromDependency('Trip[date:dd/MM/yyyy]', { Trip: '18 Sept 2025, 14:55' }, formats)).toBe('18/09/2025');
  });

  it('still works without a known source format', () => {
    expect(extractFromDependency('X[date:dd/MM/yyyy]', { X: '9th January, 2026' })).toBe('09/01/2026');
    expect(extractFromDependency('X[date:dd/MM/yyyy]', { X: 'not a date' })).toBe('not a date');
  });
});
