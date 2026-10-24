import { expect, it } from 'vitest';
import { readDuplicate, storeDuplicate } from './duplicateHandoff';

it('hands over large values (photos) by id and ignores stale ids', () => {
  const photo = 'data:image/png;base64,' + 'A'.repeat(5_000_000);
  const first = storeDuplicate({ startValues: { Photo: photo }, startFieldProps: { Photo: { rotation: 90 } } });
  expect(readDuplicate(first)?.startValues.Photo).toBe(photo);
  const second = storeDuplicate({ startValues: { Name: 'Ada' }, startFieldProps: {} });
  expect(readDuplicate(first)).toBeUndefined();
  expect(readDuplicate(second)?.startValues.Name).toBe('Ada');
  expect(readDuplicate(undefined)).toBeUndefined();
});
