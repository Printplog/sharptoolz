import { describe, expect, it } from 'vitest';
import parseSvgToFormFields from './parseSvgToFormFields';
import updateSvgFromFormData from './updateSvgFromFormData';
import { validateSvgId } from './svgIdValidator';
import { getSuggestions } from '@/components/Admin/ToolBuilder/SvgEditor/idExtensions';

describe('fixed fields', () => {
  it('accepts fixed in validation and autocomplete', () => {
    for (const id of ['Logo.fixed', 'Photo.fixed.mask_Title', 'Art.fixed.mask_Title.grayscale']) {
      expect(validateSvgId(id).valid).toBe(true);
    }
    expect(validateSvgId('Art.mask_Title').valid).toBe(false);
    expect(getSuggestions('Logo.').some(s => s.key === 'fixed')).toBe(true);
    expect(getSuggestions('Photo.fixed.').some(s => s.key === 'mask')).toBe(true);
  });

  it('parses fixed type with mask source', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><image id="Photo.fixed.mask_Title" x="0" y="0" width="100" height="50" href="art.png" /><text id="Title.text" x="10" y="20">Hi</text></svg>`;
    const fields = parseSvgToFormFields(svg);
    const photo = fields.find(f => f.id === 'Photo');
    expect(photo?.type).toBe('fixed');
    expect(photo?.maskSource).toBe('Title');
  });

  it('keeps baked href with no user value and applies mask + grayscale', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><image id="Photo.fixed.mask_Title.grayscale" x="0" y="0" width="100" height="50" href="art.png" /><text id="Title.text" x="10" y="20">Hi</text></svg>`;
    const fields = parseSvgToFormFields(svg).map(f => ({ ...f, currentValue: f.currentValue ?? '', touched: false }));
    const output = updateSvgFromFormData(svg, fields);
    expect(output).toContain('href="art.png"');
    expect(output).toContain('mask="url(#');
    expect(output).toContain('filter="url(#_gs_Photo)"');
  });
});
