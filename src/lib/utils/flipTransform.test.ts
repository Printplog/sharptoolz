import { describe, expect, it } from 'vitest';
import { buildFlipPart, getLiveElementCenter, parseFlipFlags, stripFlipParts } from '@/components/Admin/ToolBuilder/SvgEditor/ElementEditor/flipTransform';
import { validateSvgId } from './svgIdValidator';

describe('flip as transform (no ID extension)', () => {
  it('is no longer valid ID syntax', () => {
    expect(validateSvgId('Title.text.flip_h').valid).toBe(false);
    expect(validateSvgId('Photo.upload.flip_v').valid).toBe(false);
  });

  it('builds horizontal flip around text x,y', () => {
    expect(buildFlipPart(10, 20, true, false)).toBe('translate(20, 0) scale(-1, 1)');
  });

  it('builds vertical flip around image center', () => {
    expect(buildFlipPart(50, 25, false, true)).toBe('translate(0, 50) scale(1, -1)');
  });

  it('builds both axes (180-degree mirror)', () => {
    expect(buildFlipPart(10, 20, true, true)).toBe('translate(20, 40) scale(-1, -1)');
  });

  it('builds nothing when not flipping', () => {
    expect(buildFlipPart(10, 20, false, false)).toBe('');
  });

  it('parses flip flags back from our own output', () => {
    expect(parseFlipFlags('translate(20, 0) scale(-1, 1)')).toEqual({ flipH: true, flipV: false });
    expect(parseFlipFlags('rotate(10 10 20) translate(0, 50) scale(1, -1)')).toEqual({ flipH: false, flipV: true });
    expect(parseFlipFlags('translate(20, 40) scale(-1, -1)')).toEqual({ flipH: true, flipV: true });
  });

  it('ignores plain rotate/scale/translate', () => {
    expect(parseFlipFlags('rotate(10 10 20)')).toEqual({ flipH: false, flipV: false });
    expect(parseFlipFlags('scale(1.5)')).toEqual({ flipH: false, flipV: false });
    expect(parseFlipFlags('translate(5 5)')).toEqual({ flipH: false, flipV: false });
  });

  it('measures hidden mask sources by revealing them synchronously', () => {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    const text = document.createElementNS(svgNS, 'text');
    const hiddenStyle = 'font-size:40px;display:none!important';
    text.setAttribute('data-internal-id', 'masked-title');
    text.setAttribute('style', hiddenStyle);
    svg.appendChild(text);
    document.body.appendChild(svg);
    const measurable = text as unknown as { getBBox: () => { x: number; y: number; width: number; height: number } };
    measurable.getBBox = () => {
      if (text.getAttribute('style')?.includes('display:none')) throw new Error('hidden');
      return { x: 10, y: 5, width: 100, height: 40 };
    };
    try {
      expect(getLiveElementCenter('masked-title')).toEqual({ cx: 60, cy: 25 });
      expect(text.getAttribute('style')).toBe(hiddenStyle);
    } finally {
      svg.remove();
    }
  });

  it('falls back when no live preview node exists', () => {
    expect(getLiveElementCenter(undefined)).toBeNull();
    expect(getLiveElementCenter('no-such-element')).toBeNull();
  });

  it('keeps fractional centers stable', () => {
    expect(buildFlipPart(10.5, 20.25, true, false)).toBe('translate(21, 0) scale(-1, 1)');
  });

  it('strips only flip parts, preserving user transforms', () => {
    expect(stripFlipParts('rotate(10 10 20) translate(20, 0) scale(-1, 1)')).toBe('rotate(10 10 20)');
    expect(stripFlipParts('translate(5 5) scale(2)')).toBe('translate(5 5) scale(2)');
    expect(stripFlipParts('scale(2, 3)')).toBe('scale(2, 3)');
  });
});
