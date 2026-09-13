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
    return box;
  } catch {
    // Hidden (display:none, e.g. a text-mask source) or unsupported.
    return null;
  }
}

function hasArea(box: BBoxLike): boolean {
  return box.width > 0 || box.height > 0;
}

// Nodes inside non-rendered containers (defs, masks, clips) must never supply
// a flip center: their boxes live in a different coordinate context.
const NON_RENDERED_SELECTOR = "defs,mask,clipPath,symbol,pattern,marker,linearGradient,radialGradient";

function isRenderedNode(node: Element): boolean {
  try {
    return !node.closest?.(NON_RENDERED_SELECTOR);
  } catch {
    return true;
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

export function queryLiveFlipNodes(internalId: string | undefined): Element[] {
  if (!internalId || typeof document === "undefined") return [];
  try {
    const escaped =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(internalId)
        : internalId.replace(/["\\]/g, "");
    return Array.from(document.querySelectorAll(`[data-internal-id="${escaped}"]`));
  } catch {
    return [];
  }
}

function measureNode(node: Element): BBoxLike | null {
  const gfx = node as unknown as SVGGraphicsElement;
  if (!gfx || typeof gfx.getBBox !== "function") return null;
  return measureRevealed(node, gfx);
}

export function getLiveElementCenter(internalId: string | undefined): FlipCenter | null {
  const boxes: BBoxLike[] = [];
  for (const node of queryLiveFlipNodes(internalId)) {
    if (!isRenderedNode(node)) continue;
    const box = measureNode(node);
    if (box) boxes.push(box);
  }
  // Prefer a real (positive-area) box; an empty text measures 0x0 and its
  // anchor point is NOT its visual center, so never prefer it blindly.
  const box = boxes.find(hasArea) ?? boxes[0];
  if (!box) return null;
  return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
}

export interface FlipFallback {
  tag: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  text: string;
  fontSize: number | null;
  fontFamily: string;
  textAnchor: string;
}

let measureCanvas: HTMLCanvasElement | null = null;

function measureTextWidth(text: string, fontFamily: string, fontSize: number): number {
  try {
    if (typeof document === "undefined") return 0;
    if (!measureCanvas) measureCanvas = document.createElement("canvas");
    const ctx = measureCanvas.getContext("2d");
    if (!ctx) return 0;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return Math.max(...String(text ?? "").split("\n").map((line) => ctx.measureText(line).width || 0), 0);
  } catch {
    return 0;
  }
}

export function estimateTextCenter(fallback: FlipFallback): FlipCenter {
  const size = fallback.fontSize && fallback.fontSize > 0 ? fallback.fontSize : 16;
  const width = measureTextWidth(fallback.text, fallback.fontFamily || "sans-serif", size);
  const anchor = (fallback.textAnchor || "start").trim().toLowerCase();
  const cx = anchor === "middle" ? fallback.x : anchor === "end" ? fallback.x - width / 2 : fallback.x + width / 2;
  // Glyphs sit above the alphabetic baseline: visual center is ~0.35em above y.
  return { cx, cy: fallback.y - size * 0.35 };
}

export function getFlipCenter(internalId: string | undefined, fallback: FlipFallback): FlipCenter {
  const live = getLiveElementCenter(internalId);
  if (live) return live;
  const tag = (fallback.tag || "").toLowerCase();
  if (tag === "text" || tag === "tspan" || tag === "textpath") {
    return estimateTextCenter(fallback);
  }
  if (fallback.width != null && fallback.height != null && Number.isFinite(fallback.width) && Number.isFinite(fallback.height)) {
    return { cx: fallback.x + fallback.width / 2, cy: fallback.y + fallback.height / 2 };
  }
  return { cx: Number.isFinite(fallback.x) ? fallback.x : 0, cy: Number.isFinite(fallback.y) ? fallback.y : 0 };
}

interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function screenRectOf(node: Element): ScreenRect | null {
  try {
    const rect = node.getBoundingClientRect?.();
    if (!rect || !(rect.width > 0) || !(rect.height > 0)) return null;
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  } catch {
    return null;
  }
}

// Closed-loop guarantee: flipping must never move the element's on-screen box.
// Applies the candidate transform to the live node, measures the drift, and
// prepends a compensating translate (in the parent's coordinate frame) when
// the box shifted. Returns the transform string the caller should store.
export function correctFlipDrift(internalId: string | undefined, candidateTransform: string): string {
  if (!internalId || typeof document === "undefined") return candidateTransform;
  const nodes = queryLiveFlipNodes(internalId).filter(isRenderedNode);
  const node = nodes[0] ?? null;
  if (!node) return candidateTransform;
  const before = screenRectOf(node);
  if (!before) return candidateTransform;
  const previous = node.getAttribute("transform");
  try {
    node.setAttribute("transform", candidateTransform);
    const after = screenRectOf(node);
    if (!after) return candidateTransform;
    const dx = before.left + before.width / 2 - (after.left + after.width / 2);
    const dy = before.top + before.height / 2 - (after.top + after.height / 2);
    if (Math.hypot(dx, dy) < 0.5) return candidateTransform;
    const parent = node.parentElement as unknown as SVGGraphicsElement | null;
    const ctm = parent?.getScreenCTM?.();
    const inv = ctm?.inverse?.();
    if (!inv) return candidateTransform;
    // Parent frame maps local -> screen, so the compensating local shift is inv * d.
    const vx = inv.a * dx + inv.c * dy;
    const vy = inv.b * dx + inv.d * dy;
    if (!Number.isFinite(vx) || !Number.isFinite(vy) || Math.hypot(vx, vy) > 100000) return candidateTransform;
    const corrected = `translate(${fmt(vx)} ${fmt(vy)}) ${candidateTransform}`.trim();
    node.setAttribute("transform", corrected);
    return corrected;
  } catch {
    try {
      if (previous === null) node.removeAttribute("transform");
      else node.setAttribute("transform", previous);
    } catch {
      // Ignore restore failures; caller still stores the candidate transform.
    }
    return candidateTransform;
  }
}
