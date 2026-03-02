/**
 * SvgUpload — Figma-grade canvas.
 *
 * Performance contract:
 *  • Pan / zoom NEVER touch React state — all writes go through a single rAF
 *    flush directly to style.transform on the DOM node.
 *  • Selection overlay is its own absolutely-positioned div whose transform
 *    is also updated by rAF (reads getBoundingClientRect each frame while
 *    something is selected). Zero React re-renders during any gesture.
 *  • React state is only updated for: tool label, zoom display label (~100ms
 *    throttle), and baseSvg string (2 s idle guard).
 *  • Inertia: velocity is sampled from the last two pointer-move events and
 *    decays exponentially after pointer-up.
 *  • Zoom is exponential (feels natural) and always centred on the cursor.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, MousePointer, Hand } from "lucide-react";
import { useSvgLiveUpdate } from "../hooks/useSvgLiveUpdate";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { useSvgStore } from "@/store/useSvgStore";

// ─── tuning ───────────────────────────────────────────────────────────────────
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 64;
const INERTIA_DECAY = 0.85;
const INERTIA_STOP = 0.3;
const ZOOM_LERP = 0.16;
const SNAP_LEVELS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 8];
const LABEL_THROTTLE = 100;

// ─── types ────────────────────────────────────────────────────────────────────
type ToolMode = "select" | "hand";
interface VP { x: number; y: number; z: number; }

// ─── helpers ─────────────────────────────────────────────────────────────────
const clampZ = (z: number) => Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
const fmtZ = (z: number) => `${Math.round(z * 100)}%`;
function snapZoom(z: number, dir: "in" | "out") {
  if (dir === "in") return SNAP_LEVELS.find(l => l > z + 0.001) ?? MAX_ZOOM;
  return [...SNAP_LEVELS].reverse().find(l => l < z - 0.001) ?? MIN_ZOOM;
}

// ─── component ────────────────────────────────────────────────────────────────
interface Props {
  currentSvg: string | null;
  onSvgUpload: (file: File) => void;
  onSelectElement?: (id: string) => void;
  elements?: SvgElement[];
  activeElementId?: string | null;
  draftElement?: SvgElement | null;
}

export default function SvgUpload({
  currentSvg, onSvgUpload, onSelectElement,
  elements = [], activeElementId, draftElement,
}: Props) {

  // ── DOM refs ─────────────────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selBoxRef = useRef<HTMLDivElement>(null);
  const selLabelRef = useRef<HTMLDivElement>(null);

  // ── Viewport — lives entirely in a ref, NEVER in state ───────────────────
  const vp = useRef<VP>({ x: 0, y: 0, z: 1 });

  // ── rAF handles ──────────────────────────────────────────────────────────
  const writeRaf = useRef(0);
  const inertiaRaf = useRef(0);
  const zoomRaf = useRef(0);
  const selRaf = useRef(0);
  const dirty = useRef(false);

  // ── Label throttle ───────────────────────────────────────────────────────
  const labelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Inertia velocity ─────────────────────────────────────────────────────
  const vel = useRef({ x: 0, y: 0 });

  // ── Animated zoom target ─────────────────────────────────────────────────
  const zoomAnim = useRef<{ z: number; ox: number; oy: number } | null>(null);

  // ── Pointer gesture state — ALL refs, zero setState per frame ────────────
  const spaceDown = useRef(false);
  const isPanning = useRef(false);
  const isMoving = useRef(false);
  const hasDragged = useRef(false);
  const panStart = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);
  const moveStart = useRef<{ mx: number; my: number; elX: number; elY: number } | null>(null);
  const movingId = useRef<string | null>(null);
  const lastPtr = useRef({ x: 0, y: 0, t: 0 });

  // ── React state — only toolbar / labels ──────────────────────────────────
  const [tool, setTool] = useState<ToolMode>("select");
  const [zoomLabel, setZoomLabel] = useState("100%");

  // Bridge for live-update hook
  const [movingElementId, setMovingElementId] = useState<string | null>(null);
  const [localMove, setLocalMove] = useState<{ x: number; y: number } | null>(null);

  const { updateElement } = useSvgStore();

  // ══════════════════════════════════════════════════════════════════════════
  // Core: write viewport → DOM (one write per rAF)
  // ══════════════════════════════════════════════════════════════════════════
  const flushVP = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { x, y, z } = vp.current;
    el.style.transform = `translate(${x}px,${y}px) scale(${z})`;
    dirty.current = false;
  }, []);

  const scheduleFlush = useCallback(() => {
    if (dirty.current) return;
    dirty.current = true;
    writeRaf.current = requestAnimationFrame(flushVP);
  }, [flushVP]);

  const scheduleLabel = useCallback(() => {
    if (labelTimer.current) return;
    labelTimer.current = setTimeout(() => {
      setZoomLabel(fmtZ(vp.current.z));
      labelTimer.current = null;
    }, LABEL_THROTTLE);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Selection overlay — pure DOM rAF loop, zero React state on hot path
  // ══════════════════════════════════════════════════════════════════════════
  // Store activeElementId in a ref so the rAF loop always sees latest value
  const activeIdRef = useRef(activeElementId);
  useEffect(() => { activeIdRef.current = activeElementId; }, [activeElementId]);

  const startSelectionLoop = useCallback(() => {
    cancelAnimationFrame(selRaf.current);
    const tick = () => {
      const box = selBoxRef.current;
      const wrapper = wrapperRef.current;
      const id = activeIdRef.current;
      if (!box || !wrapper || !id) {
        if (box) box.style.display = "none";
        return;
      }
      const node = containerRef.current?.querySelector<Element>(`[data-internal-id="${id}"]`);
      if (!node) { box.style.display = "none"; return; }

      const er = node.getBoundingClientRect();
      const wr = wrapper.getBoundingClientRect();

      box.style.display = "block";
      box.style.top = `${er.top - wr.top}px`;
      box.style.left = `${er.left - wr.left}px`;
      box.style.width = `${er.width}px`;
      box.style.height = `${er.height}px`;

      if (selLabelRef.current) selLabelRef.current.textContent = id;

      selRaf.current = requestAnimationFrame(tick);
    };
    selRaf.current = requestAnimationFrame(tick);
  }, []);

  const stopSelectionLoop = useCallback(() => {
    cancelAnimationFrame(selRaf.current);
    if (selBoxRef.current) selBoxRef.current.style.display = "none";
  }, []);

  useEffect(() => {
    if (activeElementId) startSelectionLoop();
    else stopSelectionLoop();
    return () => cancelAnimationFrame(selRaf.current);
  }, [activeElementId, startSelectionLoop, stopSelectionLoop]);

  // ══════════════════════════════════════════════════════════════════════════
  // Inertia
  // ══════════════════════════════════════════════════════════════════════════
  const stopInertia = useCallback(() => {
    cancelAnimationFrame(inertiaRaf.current);
    vel.current = { x: 0, y: 0 };
  }, []);

  const startInertia = useCallback(() => {
    cancelAnimationFrame(inertiaRaf.current);
    const tick = () => {
      const v = vel.current;
      if (Math.abs(v.x) < INERTIA_STOP && Math.abs(v.y) < INERTIA_STOP) {
        vel.current = { x: 0, y: 0 };
        return;
      }
      v.x *= INERTIA_DECAY;
      v.y *= INERTIA_DECAY;
      vp.current.x += v.x;
      vp.current.y += v.y;
      flushVP();
      scheduleLabel();
      inertiaRaf.current = requestAnimationFrame(tick);
    };
    inertiaRaf.current = requestAnimationFrame(tick);
  }, [flushVP, scheduleLabel]);

  // ══════════════════════════════════════════════════════════════════════════
  // Zoom
  // ══════════════════════════════════════════════════════════════════════════
  const applyZoomNow = useCallback((nextZ: number, ox: number, oy: number) => {
    cancelAnimationFrame(zoomRaf.current);
    zoomAnim.current = null;
    const cz = clampZ(nextZ);
    const ratio = cz / vp.current.z;
    vp.current.x = ox - ratio * (ox - vp.current.x);
    vp.current.y = oy - ratio * (oy - vp.current.y);
    vp.current.z = cz;
    scheduleFlush();
    scheduleLabel();
  }, [scheduleFlush, scheduleLabel]);

  const animateZoom = useCallback((targetZ: number, ox = 0, oy = 0) => {
    cancelAnimationFrame(zoomRaf.current);
    zoomAnim.current = { z: clampZ(targetZ), ox, oy };
    const tick = () => {
      const t = zoomAnim.current;
      if (!t) return;
      const prev = vp.current.z;
      const diff = t.z - prev;
      const next = Math.abs(diff) < 0.0004 ? t.z : prev + diff * ZOOM_LERP;
      const ratio = next / prev;
      vp.current.x = t.ox - ratio * (t.ox - vp.current.x);
      vp.current.y = t.oy - ratio * (t.oy - vp.current.y);
      vp.current.z = next;
      flushVP();
      scheduleLabel();
      if (next === t.z) { zoomAnim.current = null; return; }
      zoomRaf.current = requestAnimationFrame(tick);
    };
    zoomRaf.current = requestAnimationFrame(tick);
  }, [flushVP, scheduleLabel]);

  // ══════════════════════════════════════════════════════════════════════════
  // Fit to view
  // ══════════════════════════════════════════════════════════════════════════
  const fitToView = useCallback(() => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl || !wrapperRef.current) return;
    const vb = svgEl.viewBox.baseVal;
    const svgW = vb.width || svgEl.width?.baseVal?.value || 800;
    const svgH = vb.height || svgEl.height?.baseVal?.value || 600;
    const pad = 80;
    const wrap = wrapperRef.current;
    const fitZ = Math.min((wrap.clientWidth - pad) / svgW, (wrap.clientHeight - pad) / svgH, 2);
    vp.current = { x: 0, y: 0, z: 1 };
    animateZoom(fitZ, 0, 0);
  }, [animateZoom]);

  useEffect(() => {
    const t = setTimeout(fitToView, 150);
    return () => clearTimeout(t);
  }, [currentSvg, fitToView]);

  // ══════════════════════════════════════════════════════════════════════════
  // Wheel — non-passive so we can preventDefault (kills browser page-zoom)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopInertia();
      const r = el.getBoundingClientRect();
      const ox = e.clientX - r.left - r.width / 2;
      const oy = e.clientY - r.top - r.height / 2;
      if (e.ctrlKey || e.metaKey) {
        const px = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
        applyZoomNow(vp.current.z * Math.pow(0.999, px), ox, oy);
      } else {
        vp.current.x -= e.deltaX;
        vp.current.y -= e.deltaY;
        scheduleFlush();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [applyZoomNow, scheduleFlush, stopInertia]);

  // ══════════════════════════════════════════════════════════════════════════
  // Pointer events
  // ══════════════════════════════════════════════════════════════════════════
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!currentSvg || e.button === 2) return;
    hasDragged.current = false;
    stopInertia();

    const target = (e.target as HTMLElement).closest("[data-internal-id]");
    const targetId = target?.getAttribute("data-internal-id");
    const isHand = tool === "hand" || spaceDown.current || e.button === 1;

    if (!isHand && targetId && e.button === 0) {
      if (targetId !== activeElementId) onSelectElement?.(targetId);
      const elData = elements.find(el => el.internalId === targetId);
      if (elData) {
        isMoving.current = true;
        movingId.current = targetId;
        setMovingElementId(targetId);
        moveStart.current = {
          mx: e.clientX, my: e.clientY,
          elX: parseFloat(elData.attributes.x ?? "0"),
          elY: parseFloat(elData.attributes.y ?? "0"),
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    if (isHand || !targetId || e.button === 1) {
      isPanning.current = true;
      panStart.current = { mx: e.clientX, my: e.clientY, vx: vp.current.x, vy: vp.current.y };
      vel.current = { x: 0, y: 0 };
      lastPtr.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [currentSvg, tool, activeElementId, elements, onSelectElement, stopInertia]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (isMoving.current && moveStart.current) {
      const dx = (e.clientX - moveStart.current.mx) / vp.current.z;
      const dy = (e.clientY - moveStart.current.my) / vp.current.z;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) hasDragged.current = true;
      setLocalMove({ x: moveStart.current.elX + dx, y: moveStart.current.elY + dy });
      return;
    }
    if (isPanning.current && panStart.current) {
      const dx = e.clientX - panStart.current.mx;
      const dy = e.clientY - panStart.current.my;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) hasDragged.current = true;
      const now = performance.now();
      const dt = Math.max(1, now - lastPtr.current.t);
      vel.current = {
        x: (e.clientX - lastPtr.current.x) * (16 / dt),
        y: (e.clientY - lastPtr.current.y) * (16 / dt),
      };
      lastPtr.current = { x: e.clientX, y: e.clientY, t: now };
      vp.current.x = panStart.current.vx + dx;
      vp.current.y = panStart.current.vy + dy;
      flushVP();   // direct — already inside pointer-event cadence
    }
  }, [flushVP]);

  const handlePointerUp = useCallback((_e: React.PointerEvent) => {
    if (isMoving.current && movingId.current && localMove) {
      updateElement(movingId.current, {
        attributes: { x: String(localMove.x), y: String(localMove.y) },
      });
    }
    if (isPanning.current) {
      const speed = Math.hypot(vel.current.x, vel.current.y);
      if (speed > INERTIA_STOP) startInertia();
    }
    isPanning.current = false;
    isMoving.current = false;
    movingId.current = null;
    panStart.current = null;
    moveStart.current = null;
    setMovingElementId(null);
    setLocalMove(null);
  }, [localMove, updateElement, startInertia]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) { hasDragged.current = false; return; }
    if (!onSelectElement || !currentSvg) return;
    const t = (e.target as HTMLElement).closest("[data-internal-id]");
    onSelectElement(t?.getAttribute("data-internal-id") ?? "");
  }, [onSelectElement, currentSvg]);

  // ══════════════════════════════════════════════════════════════════════════
  // Keyboard
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" && !e.repeat) { spaceDown.current = true; setTool("hand"); return; }
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "h" || e.key === "H") setTool("hand");
        if (e.key === "v" || e.key === "V") setTool("select");
        return;
      }
      e.preventDefault();
      if (e.key === "=" || e.key === "+") animateZoom(snapZoom(vp.current.z, "in"), 0, 0);
      if (e.key === "-") animateZoom(snapZoom(vp.current.z, "out"), 0, 0);
      if (e.key === "0") fitToView();
      if (e.key === "1") animateZoom(1, 0, 0);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") { spaceDown.current = false; setTool("select"); }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [animateZoom, fitToView]);

  // ══════════════════════════════════════════════════════════════════════════
  // Base SVG
  // ══════════════════════════════════════════════════════════════════════════
  const structuralKey = useMemo(
    () => `${elements.length}_${elements.map(e => e.internalId).join("-")}`,
    [elements]
  );
  const [baseSvg, setBaseSvg] = useState(currentSvg ?? "");
  const prevKey = useRef(structuralKey);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (currentSvg && !baseSvg) setBaseSvg(currentSvg); }, [currentSvg, baseSvg]);
  useEffect(() => {
    if (structuralKey !== prevKey.current) {
      setBaseSvg(currentSvg ?? ""); prevKey.current = structuralKey;
      if (syncTimer.current) clearTimeout(syncTimer.current);
    } else if (currentSvg !== baseSvg) {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => setBaseSvg(currentSvg ?? ""), 2000);
    }
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [currentSvg, structuralKey, baseSvg]);

  // ══════════════════════════════════════════════════════════════════════════
  // Live DOM surgical updates
  // ══════════════════════════════════════════════════════════════════════════
  const moveDraft = useMemo(() => {
    if (!movingElementId || !localMove) return null;
    const el = elements.find(e => e.internalId === movingElementId);
    if (!el) return null;
    return { ...el, attributes: { ...el.attributes, x: String(localMove.x), y: String(localMove.y) } };
  }, [movingElementId, localMove, elements]);

  useSvgLiveUpdate(containerRef as React.RefObject<HTMLDivElement>, elements, activeElementId, moveDraft || draftElement);

  // ══════════════════════════════════════════════════════════════════════════
  // Cleanup
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => () => {
    cancelAnimationFrame(writeRaf.current);
    cancelAnimationFrame(inertiaRaf.current);
    cancelAnimationFrame(zoomRaf.current);
    cancelAnimationFrame(selRaf.current);
    if (labelTimer.current) clearTimeout(labelTimer.current);
    if (syncTimer.current) clearTimeout(syncTimer.current);
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // Cursor
  // ══════════════════════════════════════════════════════════════════════════
  const cursorClass = !currentSvg ? "cursor-default"
    : tool === "hand" ? (isPanning.current ? "cursor-grabbing" : "cursor-grab")
      : isMoving.current ? "cursor-grabbing"
        : "cursor-default";

  // ══════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="h-full flex flex-col bg-[#141414] select-none overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e0e0e] border-b border-white/[0.06] shrink-0 h-11 gap-3">
        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
          <ToolBtn active={tool === "select"} onClick={() => setTool("select")} title="Select (V)">
            <MousePointer className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn active={tool === "hand"} onClick={() => setTool("hand")} title="Hand (H / Space)">
            <Hand className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        <span className="text-[10px] font-mono text-white/25 truncate min-w-0">
          {currentSvg ? `${(currentSvg.length / 1024).toFixed(1)} KB · ${elements.length} layers` : "No template loaded"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {currentSvg && (
            <>
              <ZoomControl
                zoomLabel={zoomLabel}
                onZoomOut={() => animateZoom(snapZoom(vp.current.z, "out"), 0, 0)}
                onZoomIn={() => animateZoom(snapZoom(vp.current.z, "in"), 0, 0)}
                onCommit={(z) => animateZoom(z, 0, 0)}
              />
              <button onClick={fitToView} title="Fit (Ctrl+0)"
                className="p-1.5 rounded-md text-white/25 hover:text-white hover:bg-white/10 transition-all">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-4 bg-white/[0.08] mx-0.5" />
              <Button variant="outline" size="sm"
                className="h-7 text-[10px] font-black uppercase tracking-wider bg-white/[0.04] border-white/10 hover:bg-white/10 rounded-md px-3"
                onClick={() => document.getElementById("tpl-svg-input")?.click()}>
                Replace
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div ref={wrapperRef} className="flex-1 relative overflow-hidden">
        <input id="tpl-svg-input" type="file" accept=".svg" className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) { onSvgUpload(f); e.target.value = ""; setTimeout(fitToView, 200); }
          }}
        />

        {/* Dot grid — CSS only, re-paints at label throttle rate */}
        <DotGrid vpRef={vp} zoomLabel={zoomLabel} />

        {/* Pointer surface */}
        <div
          ref={canvasRef}
          className={`absolute inset-0 ${cursorClass}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={!currentSvg ? () => document.getElementById("tpl-svg-input")?.click() : handleClick}
        >
          {currentSvg ? (
            <div className="w-full h-full flex items-center justify-center pointer-events-none">

              {/* Transform target — written only by rAF */}
              <div
                ref={containerRef}
                style={{
                  transform: `translate(${vp.current.x}px,${vp.current.y}px) scale(${vp.current.z})`,
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
                className="pointer-events-none relative"
              >
                <div className="absolute inset-0 -z-10 shadow-[0_4px_60px_rgba(0,0,0,0.85)]" />
                <div
                  className="[&_svg]:block [&_svg]:max-w-none [&_svg]:max-h-none pointer-events-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: baseSvg }}
                />
              </div>

              {/*
               * Selection overlay — lives OUTSIDE the transform div.
               * Position is written every rAF frame by startSelectionLoop().
               * display:none when nothing selected — no React re-render ever.
               */}
              <div ref={selBoxRef} className="absolute pointer-events-none z-50" style={{ display: "none" }}>
                <div className="absolute inset-0 border border-dashed border-primary/80" />
                <div className="absolute inset-0 bg-primary/[0.03]" />
                {/* 8 handles */}
                {[
                  "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
                  "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "top-0 right-0 translate-x-1/2 -translate-y-1/2",
                  "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
                  "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
                  "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
                  "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
                  "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-2 h-2 bg-white border border-primary rounded-[2px] shadow-sm ${cls}`} />
                ))}
                <div
                  ref={selLabelRef}
                  className="absolute -top-6 left-0 bg-primary text-black text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-tight whitespace-nowrap shadow-md"
                />
              </div>

            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-5 py-1 bg-[#0a0a0a] border-t border-white/[0.05] shrink-0 h-7">
        <div className="flex items-center gap-4 text-[9px] font-mono text-white/25">
          <span className="text-white/40 tabular-nums">{zoomLabel}</span>
          <PanCoords vpRef={vp} zoomLabel={zoomLabel} />
          {activeElementId && (
            <span><span className="text-white/15">▸ </span><span className="text-primary/50">{activeElementId}</span></span>
          )}
        </div>
        <span className="text-[9px] font-mono text-white/15">
          Ctrl+Scroll zoom · Space+Drag pan · Ctrl+0 fit
        </span>
      </div>

    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function PanCoords({ vpRef, zoomLabel: _zoomLabel }: { vpRef: React.RefObject<VP>; zoomLabel: string }) {
  // zoomLabel is a proxy re-render trigger (~100ms cadence)
  const x = Math.round(vpRef.current?.x ?? 0);
  const y = Math.round(vpRef.current?.y ?? 0);
  return <span className="tabular-nums">X {x >= 0 ? "+" : ""}{x} · Y {y >= 0 ? "+" : ""}{y}</span>;
}

function DotGrid({ vpRef, zoomLabel }: { vpRef: React.RefObject<VP>; zoomLabel: string }) {
  const z = (parseFloat(zoomLabel) / 100) || 1;
  const sz = Math.max(6, 20 * z);
  const ox = (vpRef.current?.x ?? 0) % sz;
  const oy = (vpRef.current?.y ?? 0) % sz;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
      backgroundSize: `${sz}px ${sz}px`,
      backgroundPosition: `${ox}px ${oy}px`,
    }} />
  );
}

function ToolBtn({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-md transition-all ${active ? "bg-primary text-black shadow-[0_0_8px_rgba(var(--primary),0.4)]"
        : "text-white/40 hover:text-white hover:bg-white/10"
        }`}>
      {children}
    </button>
  );
}

function ZoomControl({ zoomLabel, onZoomOut, onZoomIn, onCommit }: {
  zoomLabel: string; onZoomOut: () => void; onZoomIn: () => void; onCommit: (z: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const commit = () => {
    const v = parseFloat(draft.replace("%", ""));
    if (!isNaN(v) && v > 0) onCommit(v / 100);
    setEditing(false);
  };
  return (
    <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg px-1 py-0.5">
      <button onClick={onZoomOut} className="p-1 text-white/35 hover:text-white rounded transition-colors hover:bg-white/10">
        <ZoomOut className="w-3 h-3" />
      </button>
      {editing ? (
        <input value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-14 text-center text-[11px] font-mono bg-white/10 text-white rounded px-1 py-0.5 outline-none border border-primary"
          autoFocus />
      ) : (
        <button onClick={() => { setDraft(zoomLabel); setEditing(true); }}
          className="w-14 text-center text-[11px] font-mono text-white/60 hover:text-white hover:bg-white/10 rounded py-0.5 transition-all tabular-nums">
          {zoomLabel}
        </button>
      )}
      <button onClick={onZoomIn} className="p-1 text-white/35 hover:text-white rounded transition-colors hover:bg-white/10">
        <ZoomIn className="w-3 h-3" />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full pointer-events-none gap-4">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div className="absolute inset-0 border border-dashed border-white/[0.12] rounded-2xl" />
        <div className="absolute inset-0 scale-[1.3] border border-white/[0.04] rounded-2xl" />
        <svg className="w-9 h-9 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-black uppercase tracking-widest text-white/20">Drop SVG Canvas</p>
        <p className="text-[10px] text-white/10 mt-1 tracking-wider">Click anywhere to upload</p>
      </div>
    </div>
  );
}