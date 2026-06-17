import { describe, it, expect, vi } from 'vitest';
import updateSvgFromFormData from '@/lib/utils/updateSvgFromFormData';
import type { FormField } from '@/types';

vi.mock('@/lib/utils/barcodeGenerator', () => ({
  generateBarcodeDataUrlSync: (text: string) => `data:image/png;base64,mock_${text}`,
}));

const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <image id="Photo_Copy" width="100" height="100" />
</svg>`;

function makeField(overrides: Partial<FormField>): FormField {
  return {
    id: 'Photo_Copy',
    name: 'Photo Copy',
    // depends fields get type=base_id from backend; grayscale triggers via isImageValue+dependsOn
    type: 'text',
    dependsOn: 'Photo',
    currentValue: 'data:image/png;base64,abc',
    touched: true,
    ...overrides,
  };
}

function makeSourceField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'Photo',
    name: 'Photo',
    type: 'upload',
    currentValue: 'data:image/png;base64,abc',
    touched: true,
    ...overrides,
  };
}

describe('updateSvgFromFormData — grayscale on depends fields', () => {
  it('applies SVG filter when the dep field itself has requiresGrayscale', () => {
    const depField = makeField({ requiresGrayscale: true, grayscaleIntensity: 100 });
    const sourceField = makeSourceField({ requiresGrayscale: false });

    const result = updateSvgFromFormData(baseSvg, [depField, sourceField]);
    expect(result).toContain('feColorMatrix');
    expect(result).toContain('filter=');
    expect(result).toContain('values="0"');
  });

  it('uses the dep field own intensity, not a hardcoded value', () => {
    const depField = makeField({ requiresGrayscale: true, grayscaleIntensity: 50 });
    const sourceField = makeSourceField({ requiresGrayscale: false });

    const result = updateSvgFromFormData(baseSvg, [depField, sourceField]);
    // 50% intensity → feColorMatrix values = 1 - 50/100 = 0.5
    expect(result).toContain('values="0.5"');
  });

  it('does NOT apply a filter when only the source has grayscale (no inheritance)', () => {
    const depField = makeField({ requiresGrayscale: false });
    const sourceField = makeSourceField({ requiresGrayscale: true, grayscaleIntensity: 100 });

    const result = updateSvgFromFormData(baseSvg, [depField, sourceField]);
    expect(result).not.toContain('feColorMatrix');
    expect(result).not.toContain('filter=');
  });

  it('does NOT apply a filter when neither field has grayscale', () => {
    const depField = makeField({ requiresGrayscale: false });
    const sourceField = makeSourceField({ requiresGrayscale: false });

    const result = updateSvgFromFormData(baseSvg, [depField, sourceField]);
    expect(result).not.toContain('feColorMatrix');
    expect(result).not.toContain('filter=');
  });
});

const barcodeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <image id="barcode_test" width="100" height="100" />
</svg>`;

describe('updateSvgFromFormData — barcode fields', () => {
  it('generates barcode on-the-fly when currentValue is text', () => {
    const field: FormField = {
      id: 'barcode_test',
      name: 'Barcode Test',
      type: 'barcode',
      symbology: 'code128',
      currentValue: '12345678',
      touched: true,
    };

    const result = updateSvgFromFormData(barcodeSvg, [field]);
    expect(result).toContain('data:image/png;base64');
    expect(result).toContain('preserveAspectRatio="none"');
  });

  it('keeps fixed aspect ratio for pdf417', () => {
    const field: FormField = {
      id: 'barcode_test',
      name: 'Barcode Test',
      type: 'barcode',
      symbology: 'pdf417',
      currentValue: '12345678',
      touched: true,
    };

    const result = updateSvgFromFormData(barcodeSvg, [field]);
    expect(result).toContain('data:image/png;base64');
    expect(result).toContain('preserveAspectRatio="xMidYMid meet"');
  });
});

