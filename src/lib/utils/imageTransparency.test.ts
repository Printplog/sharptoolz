import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasTransparentEdges } from './imageTransparency';

// jsdom has no canvas or image decoding, so stub both with a fake alpha map
function stubImage(alphaAt: (x: number, y: number) => number) {
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) { queueMicrotask(() => this.onload?.()); }
  });
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') throw new Error(tag);
    return {
      width: 0, height: 0,
      getContext: () => ({
        drawImage: () => {},
        getImageData: (_x: number, _y: number, w: number, h: number) => {
          const data = new Uint8ClampedArray(w * h * 4);
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[(y * w + x) * 4 + 3] = alphaAt(x, y);
          return { data };
        },
      }),
    };
  }) as typeof document.createElement);
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('hasTransparentEdges', () => {
  it('is true for a cut-out photo (see-through edges)', async () => {
    stubImage((x, y) => (x > 10 && x < 54 && y > 10 ? 255 : 0));
    expect(await hasTransparentEdges('data:image/png;base64,x')).toBe(true);
  });

  it('is false for a normal photo with a background', async () => {
    stubImage(() => 255);
    expect(await hasTransparentEdges('data:image/jpeg;base64,x')).toBe(false);
  });
});
