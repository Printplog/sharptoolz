import { describe, expect, it } from 'vitest';
import { buildFlipPart, correctFlipDrift, estimateTextCenter, getFlipCenter, getLiveElementCenter, parseFlipFlags, stripFlipParts } from '@/components/Admin/ToolBuilder/SvgEditor/ElementEditor/flipTransform';
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

describe('flip never moves the element', () => {
  const svgNS = 'http://www.w3.org/2000/svg';

  function makeText(id: string, box: { x: number; y: number; width: number; height: number } | null, parent?: Element) {
    const svg = document.createElementNS(svgNS, 'svg');
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('data-internal-id', id);
    const t = text as unknown as { getBBox: () => { x: number; y: number; width: number; height: number } };
    if (box) t.getBBox = () => ({ ...box });
    else t.getBBox = () => { throw new Error('no box'); };
    svg.appendChild(text);
    (parent ?? document.body).appendChild(svg);
    return { svg, text };
  }

  it('prefers the live box over attribute fallbacks', () => {
    const { svg } = makeText('flip-live', { x: 10, y: 20, width: 60, height: 20 });
    try {
      expect(getFlipCenter('flip-live', {
        tag: 'text', x: 0, y: 0, width: null, height: null,
        text: 'Hi', fontSize: 16, fontFamily: 'sans-serif', textAnchor: 'start',
      })).toEqual({ cx: 40, cy: 30 });
    } finally {
      svg.remove();
    }
  });

  it('falls back to shape geometry when no live node exists', () => {
    expect(getFlipCenter('flip-missing-rect', {
      tag: 'rect', x: 10, y: 20, width: 60, height: 20,
      text: '', fontSize: null, fontFamily: 'sans-serif', textAnchor: 'start',
    })).toEqual({ cx: 40, cy: 30 });
  });

  it('estimates text center without a live node instead of using the anchor', () => {
    // jsdom has no canvas 2d context, so measured width is 0: cx stays at the
    // anchor but cy accounts for glyphs sitting above the baseline.
    expect(estimateTextCenter({
      tag: 'text', x: 100, y: 50, width: null, height: null,
      text: 'Hello', fontSize: 20, fontFamily: 'sans-serif', textAnchor: 'start',
    })).toEqual({ cx: 100, cy: 50 - 20 * 0.35 });
  });

  it('ignores duplicates hidden inside defs', () => {
    const defsSvg = document.createElementNS(svgNS, 'svg');
    const defs = document.createElementNS(svgNS, 'defs');
    const ghost = document.createElementNS(svgNS, 'text');
    ghost.setAttribute('data-internal-id', 'flip-dup');
    (ghost as unknown as { getBBox: () => unknown }).getBBox = () => ({ x: 500, y: 500, width: 60, height: 20 });
    defs.appendChild(ghost);
    defsSvg.appendChild(defs);
    document.body.appendChild(defsSvg);
    const { svg } = makeText('flip-dup', { x: 10, y: 20, width: 60, height: 20 });
    try {
      expect(getLiveElementCenter('flip-dup')).toEqual({ cx: 40, cy: 30 });
    } finally {
      svg.remove();
      defsSvg.remove();
    }
  });

  it('skips zero-area matches in favor of a measurable one', () => {
    const first = makeText('flip-zero', { x: 0, y: 0, width: 0, height: 0 });
    const second = makeText('flip-zero', { x: 10, y: 20, width: 60, height: 20 });
    try {
      expect(getLiveElementCenter('flip-zero')).toEqual({ cx: 40, cy: 30 });
    } finally {
      first.svg.remove();
      second.svg.remove();
    }
  });

  it('prepends a compensating translate when the box drifted', () => {
    const svg = document.createElementNS(svgNS, 'svg');
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('data-internal-id', 'flip-drift');
    svg.appendChild(g);
    document.body.appendChild(svg);
    const rects = [
      { left: 100, top: 50, width: 70, height: 29 },
      { left: 170, top: 50, width: 70, height: 29 },
    ];
    let calls = 0;
    (g as unknown as { getBoundingClientRect: () => unknown }).getBoundingClientRect = () => rects[Math.min(calls++, 1)];
    (svg as unknown as { getScreenCTM: () => unknown }).getScreenCTM = () => ({
      a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
      inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    });
    try {
      const out = correctFlipDrift('flip-drift', 'translate(200, 0) scale(-1, 1)');
      expect(out).toBe('translate(-70 0) translate(200, 0) scale(-1, 1)');
      expect(g.getAttribute('transform')).toBe(out);
    } finally {
      svg.remove();
    }
  });

  it('leaves the transform alone when the box did not move', () => {
    const svg = document.createElementNS(svgNS, 'svg');
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('data-internal-id', 'flip-steady');
    svg.appendChild(g);
    document.body.appendChild(svg);
    const rect = { left: 100, top: 50, width: 70, height: 29 };
    (g as unknown as { getBoundingClientRect: () => unknown }).getBoundingClientRect = () => ({ ...rect });
    try {
      expect(correctFlipDrift('flip-steady', 'translate(200, 0) scale(-1, 1)')).toBe('translate(200, 0) scale(-1, 1)');
    } finally {
      svg.remove();
    }
  });

  it('returns the candidate when there is nothing measurable to preserve', () => {
    expect(correctFlipDrift('flip-ghost', 'translate(200, 0) scale(-1, 1)')).toBe('translate(200, 0) scale(-1, 1)');
    expect(correctFlipDrift(undefined, 'translate(200, 0) scale(-1, 1)')).toBe('translate(200, 0) scale(-1, 1)');
  });
});
