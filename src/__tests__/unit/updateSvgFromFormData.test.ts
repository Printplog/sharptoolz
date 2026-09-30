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

describe('updateSvgFromFormData — authored text layout', () => {
  const field: FormField = {
    id: 'Address',
    name: 'Address',
    type: 'textarea',
    svgElementId: 'Address.textarea',
    currentValue: '19 Washington Square\nNew York, NY 10011\nUSA',
    touched: true,
  };

  it('does not move a mixed direct-text/tspan block down by one line', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <style>.address { font-size: 64px; }</style>
      <text id="Address.textarea" class="address" transform="matrix(.339 -.02 .02 .339 370 500)">Old line one<tspan x="0" dy="78">Old line two</tspan><tspan x="0" dy="78">Old line three</tspan></text>
    </svg>`;

    const result = updateSvgFromFormData(svg, [field]);
    const doc = new DOMParser().parseFromString(result, 'image/svg+xml');
    const text = doc.getElementById('Address.textarea')!;
    const spans = Array.from(text.querySelectorAll('tspan'));

    expect(text.getAttribute('transform')).toBe('matrix(.339 -.02 .02 .339 370 500)');
    expect(text.firstChild?.nodeType).toBe(Node.TEXT_NODE);
    expect(text.firstChild?.textContent).toBe('19 Washington Square');
    expect(spans.map((span) => span.textContent)).toEqual(['New York, NY 10011', 'USA']);
    expect(spans[0].getAttribute('dy')).toBe('78');
    expect(spans[1].getAttribute('dy')).toBe('78');
  });

  it('preserves a single authored tspan position for single-line updates', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <text id="Address.textarea"><tspan x="40" y="90" class="line">Old</tspan></text>
    </svg>`;
    const result = updateSvgFromFormData(svg, [{ ...field, currentValue: 'Updated' }]);
    const span = new DOMParser().parseFromString(result, 'image/svg+xml').querySelector('tspan')!;

    expect(span.textContent).toBe('Updated');
    expect(span.getAttribute('x')).toBe('40');
    expect(span.getAttribute('y')).toBe('90');
    expect(span.getAttribute('class')).toBe('line');
  });

  it('repairs an authored dy that would overlap multiline text', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <style>.cls-6 { fill: black; } .cls-6 { font-size: 62.864px; font-family: Arial; }</style>
      <text id="Address.textarea" class="cls-6" transform="matrix(.345 -.02 .02 .345 400 596)">
        <tspan x="0">Old line one</tspan><tspan x="0" dy="18.2">Old line two</tspan>
      </text>
    </svg>`;
    const result = updateSvgFromFormData(svg, [{
      ...field,
      currentValue: '0000 IDGOD.PH\nIDGOD.PH, WY 00000',
    }]);
    const text = new DOMParser().parseFromString(result, 'image/svg+xml').getElementById('Address.textarea')!;
    const spans = Array.from(text.querySelectorAll('tspan'));

    expect(text.getAttribute('transform')).toBe('matrix(.345 -.02 .02 .345 400 596)');
    expect(spans[0].hasAttribute('dy')).toBe(false);
    expect(parseFloat(spans[1].getAttribute('dy')!)).toBeCloseTo(62.864 * 1.2);
  });
});
