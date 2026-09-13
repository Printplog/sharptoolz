export interface FlipFlags {
  flipH: boolean;
  flipV: boolean;
}

const TWO_ARG_SCALE_RE = /scale\(\s*(-?[\d.]+)\s*[\s,]\s*(-?[\d.]+)\s*\)/g;
const SINGLE_SCALE_RE = /scale\(\s*(-?[\d.]+)\s*\)/g;
const MATRIX_RE = /matrix\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/g;

export function parseFlipFlags(transformAttr = "", styleAttr = ""): FlipFlags {
  const combined = `${styleAttr || ""} ${transformAttr || ""}`;
  let flipH = false;
  let flipV = false;
  for (const m of combined.matchAll(TWO_ARG_SCALE_RE)) {
    if (parseFloat(m[1]) === -1) flipH = true;
    if (parseFloat(m[2]) === -1) flipV = true;
  }
  if (!flipH || !flipV) {
    for (const m of combined.matchAll(SINGLE_SCALE_RE)) {
      if (parseFloat(m[1]) === -1) {
        flipH = true;
        flipV = true;
      }
    }
  }
  for (const m of combined.matchAll(MATRIX_RE)) {
    if (parseFloat(m[1]) < 0) flipH = true;
    if (parseFloat(m[4]) < 0) flipV = true;
  }
  return { flipH, flipV };
}

function fmt(n: number): string {
  const rounded = Math.round(n * 1000) / 1000;
  return String(rounded);
}

export function buildFlipPart(cx: number, cy: number, flipH: boolean, flipV: boolean): string {
  if (!flipH && !flipV) return "";
  const sx = flipH ? -1 : 1;
  const sy = flipV ? -1 : 1;
  const tx = flipH ? 2 * cx : 0;
  const ty = flipV ? 2 * cy : 0;
  return `translate(${fmt(tx)}, ${fmt(ty)}) scale(${sx}, ${sy})`;
}

export function stripFlipParts(transformAttr = ""): string {
  let out = transformAttr.replace(
    /translate\(\s*-?[\d.]+\s*[\s,]\s*-?[\d.]+\s*\)\s*scale\(\s*(-?[\d.]+)\s*[\s,]\s*(-?[\d.]+)\s*\)/g,
    (match, sx, sy) => (parseFloat(sx) === -1 || parseFloat(sy) === -1 ? " " : match)
  );
  out = out.replace(/scale\(\s*-1\s*\)/g, " ");
  return out.replace(/\s+/g, " ").trim();
}

export interface FlipCenter {
  cx: number;
  cy: number;
}

interface BBoxLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

function safeBBox(gfx: SVGGraphicsElement): BBoxLike | null {
  try {
    const box = gfx.getBBox() as unknown as BBoxLike;
    if (!box || ![box.x, box.y, box.width, box.height].every(Number.isFinite)) return null;
    if (box.width <= 0 && box.height <= 0) return null;
    return box;
  } catch {
    // Hidden (display:none, e.g. a text-mask source) or unsupported.
    return null;
  }
}

function measureRevealed(node: Element, gfx: SVGGraphicsElement): BBoxLike | null {
  const direct = safeBBox(gfx);
  if (direct) return direct;
  // Mask sources are hidden via inline display:none: reveal synchronously,
  // measure, then restore the exact saved style. No paint happens in between.
  const saved = node.getAttribute("style");
  const cleaned = (saved ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part && !/^display\s*:\s*none/i.test(part))
    .join("; ");
  if (!saved?.match(/display\s*:\s*none/i)) return null;
  try {
    if (cleaned) node.setAttribute("style", cleaned);
    else node.removeAttribute("style");
    return safeBBox(gfx);
  } finally {
    if (saved === null) node.removeAttribute("style");
    else node.setAttribute("style", saved);
  }
}

export function getLiveElementCenter(internalId: string | undefined): FlipCenter | null {
  if (!internalId || typeof document === "undefined") return null;
  try {
    const escaped =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(internalId)
        : internalId.replace(/["\\]/g, "");
    const nodes = document.querySelectorAll(`[data-internal-id="${escaped}"]`);
    for (const node of Array.from(nodes)) {
      const gfx = node as unknown as SVGGraphicsElement;
      if (!gfx || typeof gfx.getBBox !== "function") continue;
      const box = measureRevealed(node as Element, gfx);
      if (!box) continue;
      return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
    }
  } catch {
    // No live preview node (or getBBox unsupported) — caller falls back to attribute math.
  }
  return null;
}
