import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageCropperProps {
  image: string;
  onCrop: (dataUrl: string) => void;
  initialSelection?: { x: number; y: number; w: number; h: number };
}

export interface ImageCropperRef {
  crop: () => void;
}

interface DragState {
  mode: "idle" | "draw" | "move" | "resize";
  handle: string;
  startMouseX: number;
  startMouseY: number;
  startSelX: number;
  startSelY: number;
  startSelW: number;
  startSelH: number;
  boundsLeft: number;
  boundsTop: number;
  boundsW: number;
  boundsH: number;
}

const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>(
  ({ image, onCrop, initialSelection }, ref) => {
    // React state only used for: initial mount, image change, pointerup commit
    const [selection, setSelection] = useState<Selection | null>(null);
    const [layoutSize, setLayoutSize] = useState({ w: 0, h: 0 });

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Direct DOM refs for zero-React-overhead updates during drag
    const selBoxRef = useRef<HTMLDivElement>(null);
    const overlayTopRef = useRef<HTMLDivElement>(null);
    const overlayBotRef = useRef<HTMLDivElement>(null);
    const overlayLeftRef = useRef<HTMLDivElement>(null);
    const overlayRightRef = useRef<HTMLDivElement>(null);
    const badgeRef = useRef<HTMLDivElement>(null);

    const drag = useRef<DragState>({
      mode: "idle",
      handle: "",
      startMouseX: 0,
      startMouseY: 0,
      startSelX: 0,
      startSelY: 0,
      startSelW: 0,
      startSelH: 0,
      boundsLeft: 0,
      boundsTop: 0,
      boundsW: 1,
      boundsH: 1,
    });

    const selRef = useRef<Selection | null>(null);
    const layoutRef = useRef({ w: 0, h: 0 });
    const initializedRef = useRef(false);
    const hasUserInteracted = useRef(false);

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    // ── Direct DOM paint — zero React involvement, runs on every pointermove ──
    const paintDOM = useCallback((s: Selection) => {
      const lw = layoutRef.current.w;
      const lh = layoutRef.current.h;
      if (!lw || !lh) return;

      const px = s.x * lw;
      const py = s.y * lh;
      const pw = s.w * lw;
      const ph = s.h * lh;

      const box = selBoxRef.current;
      if (box) {
        box.style.left = `${px}px`;
        box.style.top = `${py}px`;
        box.style.width = `${pw}px`;
        box.style.height = `${ph}px`;
        box.style.display = "block";
      }

      const ot = overlayTopRef.current;
      if (ot) ot.style.height = `${py}px`;

      const ob = overlayBotRef.current;
      if (ob) ob.style.top = `${py + ph}px`;

      const ol = overlayLeftRef.current;
      if (ol) {
        ol.style.top = `${py}px`;
        ol.style.width = `${px}px`;
        ol.style.height = `${ph}px`;
      }

      const or_ = overlayRightRef.current;
      if (or_) {
        or_.style.top = `${py}px`;
        or_.style.left = `${px + pw}px`;
        or_.style.height = `${ph}px`;
      }

      const badge = badgeRef.current;
      if (badge) {
        if (pw > 40 && ph > 40) {
          const nw = imgRef.current?.naturalWidth || 0;
          const nh = imgRef.current?.naturalHeight || 0;
          badge.textContent = `${Math.round(s.w * nw)} × ${Math.round(s.h * nh)}`;
          badge.style.display = "block";
        } else {
          badge.style.display = "none";
        }
      }
    }, []);

    // Commit to React state — only on pointerup and init
    const commitSel = useCallback((s: Selection | null) => {
      selRef.current = s;
      setSelection(s);
      if (s) {
        paintDOM(s);
      } else {
        if (selBoxRef.current) selBoxRef.current.style.display = "none";
        if (overlayTopRef.current) overlayTopRef.current.style.height = "0px";
        if (overlayBotRef.current) overlayBotRef.current.style.top = "0px";
        if (overlayLeftRef.current) overlayLeftRef.current.style.width = "0px";
        if (overlayRightRef.current) overlayRightRef.current.style.left = "100%";
        if (badgeRef.current) badgeRef.current.style.display = "none";
      }
    }, [paintDOM]);

    const snapBounds = () => {
      const img = imgRef.current;
      if (!img) return false;
      const r = img.getBoundingClientRect();
      drag.current.boundsLeft = r.left;
      drag.current.boundsTop = r.top;
      drag.current.boundsW = r.width || 1;
      drag.current.boundsH = r.height || 1;
      return true;
    };

    const initSelection = useCallback(() => {
      if (hasUserInteracted.current) return;
      const s = initialSelection ? { ...initialSelection } : { x: 0, y: 0, w: 1, h: 1 };
      commitSel(s);
      initializedRef.current = true;
    }, [initialSelection, commitSel]);

    useEffect(() => {
      if (initialSelection && !initializedRef.current && !hasUserInteracted.current) {
        initSelection();
      }
    }, [initialSelection, initSelection]);

    useEffect(() => {
      initializedRef.current = false;
      hasUserInteracted.current = false;
      commitSel(null);
    }, [image, initialSelection]);

    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;
      const observer = new ResizeObserver(() => {
        if (img.width > 0 && img.height > 0) {
          layoutRef.current = { w: img.width, h: img.height };
          setLayoutSize({ w: img.width, h: img.height });
          if (!initializedRef.current) initSelection();
          else if (selRef.current) paintDOM(selRef.current);
        }
      });
      observer.observe(img);
      if (img.width > 0 && img.height > 0) {
        layoutRef.current = { w: img.width, h: img.height };
        setLayoutSize({ w: img.width, h: img.height });
        if (!initializedRef.current) initSelection();
      }
      return () => observer.disconnect();
    }, [image, initSelection, paintDOM]);

    const handleImageLoad = () => {
      if (imgRef.current) {
        const sz = { w: imgRef.current.width, h: imgRef.current.height };
        layoutRef.current = sz;
        setLayoutSize(sz);
      }
      if (!initializedRef.current) initSelection();
    };

    // ── Pointer handlers ──

    const handleContainerPointerDown = useCallback((e: React.PointerEvent) => {
      if ((e.target as HTMLElement).dataset.handle) return;
      if (!snapBounds()) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      hasUserInteracted.current = true;

      const { boundsLeft, boundsTop, boundsW, boundsH } = drag.current;
      const nx = (e.clientX - boundsLeft) / boundsW;
      const ny = (e.clientY - boundsTop) / boundsH;
      const sel = selRef.current;

      if (sel && nx >= sel.x && nx <= sel.x + sel.w && ny >= sel.y && ny <= sel.y + sel.h) {
        drag.current = { ...drag.current, mode: "move", handle: "", startMouseX: e.clientX, startMouseY: e.clientY, startSelX: sel.x, startSelY: sel.y, startSelW: sel.w, startSelH: sel.h };
        if (selBoxRef.current) selBoxRef.current.style.cursor = "grabbing";
      } else {
        const cx = clamp(nx, 0, 1);
        const cy = clamp(ny, 0, 1);
        drag.current = { ...drag.current, mode: "draw", handle: "", startMouseX: e.clientX, startMouseY: e.clientY, startSelX: cx, startSelY: cy, startSelW: 0, startSelH: 0 };
        const s = { x: cx, y: cy, w: 0, h: 0 };
        selRef.current = s;
        paintDOM(s);
      }
    }, [paintDOM]);

    const handleHandlePointerDown = useCallback((e: React.PointerEvent, handle: string) => {
      e.stopPropagation();
      const sel = selRef.current;
      if (!sel || !snapBounds()) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      hasUserInteracted.current = true;
      drag.current = { ...drag.current, mode: "resize", handle, startMouseX: e.clientX, startMouseY: e.clientY, startSelX: sel.x, startSelY: sel.y, startSelW: sel.w, startSelH: sel.h };
    }, []);

    // ── Hot path — direct DOM only, zero setState ──
    const handlePointerMove = useCallback((e: PointerEvent) => {
      const d = drag.current;
      if (d.mode === "idle") return;

      const { boundsW, boundsH, boundsLeft, boundsTop } = d;
      let s: Selection;

      if (d.mode === "draw") {
        const mx = clamp((e.clientX - boundsLeft) / boundsW, 0, 1);
        const my = clamp((e.clientY - boundsTop) / boundsH, 0, 1);
        s = { x: Math.min(mx, d.startSelX), y: Math.min(my, d.startSelY), w: Math.abs(mx - d.startSelX), h: Math.abs(my - d.startSelY) };
      } else if (d.mode === "move") {
        const dx = (e.clientX - d.startMouseX) / boundsW;
        const dy = (e.clientY - d.startMouseY) / boundsH;
        s = { x: clamp(d.startSelX + dx, 0, 1 - d.startSelW), y: clamp(d.startSelY + dy, 0, 1 - d.startSelH), w: d.startSelW, h: d.startSelH };
      } else {
        const dx = (e.clientX - d.startMouseX) / boundsW;
        const dy = (e.clientY - d.startMouseY) / boundsH;
        let { startSelX: x, startSelY: y, startSelW: w, startSelH: h, handle } = d;
        if (handle.includes("r")) w = clamp(w + dx, 0.01, 1 - x);
        if (handle.includes("b")) h = clamp(h + dy, 0.01, 1 - y);
        if (handle.includes("l")) { const adx = clamp(dx, -x, w - 0.01); x += adx; w -= adx; }
        if (handle.includes("t")) { const ady = clamp(dy, -y, h - 0.01); y += ady; h -= ady; }
        s = { x, y, w: clamp(w, 0, 1 - x), h: clamp(h, 0, 1 - y) };
      }

      selRef.current = s;
      paintDOM(s); // ← direct DOM write, no React
    }, [paintDOM]);

    const handlePointerUp = useCallback(() => {
      drag.current.mode = "idle";
      if (selBoxRef.current) selBoxRef.current.style.cursor = "move";
      // Single setState on finger lift — syncs React with final position
      if (selRef.current) commitSel(selRef.current);
    }, [commitSel]);

    useEffect(() => {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }, [handlePointerMove, handlePointerUp]);

    // ── Crop ──
    useImperativeHandle(ref, () => ({
      crop: () => {
        const sel = selRef.current;
        if (!sel || !imgRef.current) return;
        const nw = imgRef.current.naturalWidth;
        const nh = imgRef.current.naturalHeight;
        const cw = Math.max(1, Math.round(sel.w * nw));
        const ch = Math.max(1, Math.round(sel.h * nh));
        const sx = Math.max(0, Math.min(nw - cw / 100, Math.round(sel.x * nw)));
        const sy = Math.max(0, Math.min(nh - ch / 100, Math.round(sel.y * nh)));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(imgRef.current, sx, sy, Math.min(cw, nw - sx), Math.min(ch, nh - sy), 0, 0, cw, ch);
        setTimeout(() => onCrop(canvas.toDataURL("image/png")), 10);
      },
    }));

    // ── Handle styles ──
    const cornerHandles = ["tl", "tr", "bl", "br"];
    const edgeHandles = ["t", "r", "b", "l"];
    const handles = [...cornerHandles, ...edgeHandles];

    const getHandleStyle = (h: string): React.CSSProperties => {
      const isCorner = h.length === 2;
      const hitSize = 44;
      const hitOffset = -(hitSize / 2);
      const base: React.CSSProperties = {
        position: "absolute", width: hitSize, height: hitSize,
        background: "transparent", border: "none", zIndex: 50,
        touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: h === "t" || h === "b" ? "ns-resize" : h === "l" || h === "r" ? "ew-resize" : h === "tl" || h === "br" ? "nwse-resize" : "nesw-resize",
      };
      if (isCorner) return { ...base, top: h.includes("t") ? hitOffset : "auto", bottom: h.includes("b") ? hitOffset : "auto", left: h.includes("l") ? hitOffset : "auto", right: h.includes("r") ? hitOffset : "auto" };
      return { ...base, top: h === "t" ? hitOffset : h === "b" ? "auto" : "calc(50% - 22px)", bottom: h === "b" ? hitOffset : "auto", left: h === "l" ? hitOffset : h === "r" ? "auto" : "calc(50% - 22px)", right: h === "r" ? hitOffset : "auto" };
    };

    const getDotStyle = (h: string): React.CSSProperties => {
      const isCorner = h.length === 2;
      return { width: isCorner ? 9 : 7, height: isCorner ? 9 : 7, borderRadius: isCorner ? 2 : "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.2)", flexShrink: 0, pointerEvents: "none" };
    };

    const hasSelection = !!selection && layoutSize.w > 0;
    const S = selection;
    const LW = layoutSize.w;
    const LH = layoutSize.h;

    return (
      <div
        ref={containerRef}
        style={{ position: "relative", display: "inline-block", userSelect: "none", touchAction: "none", lineHeight: 0, maxWidth: "100%", borderRadius: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.5)", willChange: "transform" }}
        onPointerDown={handleContainerPointerDown}
      >
        <img
          ref={imgRef}
          src={image}
          alt="Crop target"
          style={{ maxHeight: "80vh", maxWidth: "100%", width: "auto", height: "auto", display: "block", borderRadius: 8 }}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Overlays — always in DOM, paintDOM mutates style directly */}
        <div ref={overlayTopRef}   style={{ position: "absolute", top: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", height: hasSelection ? S!.y * LH : 0 }} />
        <div ref={overlayBotRef}   style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", top: hasSelection ? (S!.y + S!.h) * LH : 0 }} />
        <div ref={overlayLeftRef}  style={{ position: "absolute", background: "rgba(0,0,0,0.55)", pointerEvents: "none", top: hasSelection ? S!.y * LH : 0, width: hasSelection ? S!.x * LW : 0, height: hasSelection ? S!.h * LH : 0 }} />
        <div ref={overlayRightRef} style={{ position: "absolute", right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", top: hasSelection ? S!.y * LH : 0, left: hasSelection ? (S!.x + S!.w) * LW : "100%", height: hasSelection ? S!.h * LH : 0 }} />

        {/* Selection box — always in DOM, paintDOM positions it */}
        <div
          ref={selBoxRef}
          style={{
            position: "absolute",
            display: hasSelection ? "block" : "none",
            left: hasSelection ? S!.x * LW : 0,
            top: hasSelection ? S!.y * LH : 0,
            width: hasSelection ? S!.w * LW : 0,
            height: hasSelection ? S!.h * LH : 0,
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
            cursor: "move",
            zIndex: 20,
            boxSizing: "border-box",
            willChange: "left, top, width, height",
          }}
        >
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)" }} />
            <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)" }} />
          </div>

          {[
            { top: -1, left: -1,  borderTop: "2px solid #fff", borderLeft:  "2px solid #fff", width: 16, height: 16 },
            { top: -1, right: -1, borderTop: "2px solid #fff", borderRight: "2px solid #fff", width: 16, height: 16 },
            { bottom: -1, left: -1,  borderBottom: "2px solid #fff", borderLeft:  "2px solid #fff", width: 16, height: 16 },
            { bottom: -1, right: -1, borderBottom: "2px solid #fff", borderRight: "2px solid #fff", width: 16, height: 16 },
          ].map((s, i) => (
            <div key={i} style={{ position: "absolute", pointerEvents: "none", ...s }} />
          ))}

          {handles.map((h) => (
            <div key={h} onPointerDown={(e) => handleHandlePointerDown(e, h)} style={getHandleStyle(h)} data-handle="true">
              <div style={getDotStyle(h)} />
            </div>
          ))}
        </div>

        {/* Dimensions badge */}
        <div
          ref={badgeRef}
          style={{
            position: "absolute", bottom: 8, left: 8,
            display: hasSelection && S!.w * LW > 40 && S!.h * LH > 40 ? "block" : "none",
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
            color: "white", fontSize: 10, fontFamily: "ui-monospace, monospace",
            padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)",
            zIndex: 60, pointerEvents: "none",
          }}
        >
          {hasSelection ? `${Math.round(S!.w * (imgRef.current?.naturalWidth || 0))} × ${Math.round(S!.h * (imgRef.current?.naturalHeight || 0))}` : ""}
        </div>
      </div>
    );
  }
);

ImageCropper.displayName = "ImageCropper";
export default ImageCropper;