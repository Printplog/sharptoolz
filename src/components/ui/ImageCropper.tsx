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

// All mutable drag state lives in a ref — never in React state — so no re-renders occur during pointer moves
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
    const [selection, setSelection] = useState<Selection | null>(null);
    const [layoutSize, setLayoutSize] = useState({ w: 0, h: 0 });

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // All drag state in a single ref — zero setState calls during pointermove
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

    // Keep selection in a ref too so pointermove handler always reads fresh value
    const selRef = useRef<Selection | null>(null);
    const initializedRef = useRef(false);
    const hasUserInteracted = useRef(false);

    const syncSel = (s: Selection | null) => {
      selRef.current = s;
      setSelection(s);
    };

    // Snapshot bounds once at pointer-down — avoids getBoundingClientRect on every move frame
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

    const clamp = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v));

    const initSelection = useCallback(() => {
      if (hasUserInteracted.current) return;
      if (initialSelection) {
        syncSel({ ...initialSelection });
      } else {
        syncSel({ x: 0, y: 0, w: 1, h: 1 });
      }
      initializedRef.current = true;
    }, [initialSelection]);

    useEffect(() => {
      if (initialSelection && !initializedRef.current && !hasUserInteracted.current) {
        initSelection();
      }
    }, [initialSelection, initSelection]);

    useEffect(() => {
      initializedRef.current = false;
      hasUserInteracted.current = false;
      syncSel(null);
    }, [image, initialSelection]);

    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;
      const observer = new ResizeObserver(() => {
        if (img.width > 0 && img.height > 0) {
          setLayoutSize({ w: img.width, h: img.height });
          if (!initializedRef.current) initSelection();
        }
      });
      observer.observe(img);
      if (img.width > 0 && img.height > 0) {
        setLayoutSize({ w: img.width, h: img.height });
        if (!initializedRef.current) initSelection();
      }
      return () => observer.disconnect();
    }, [image, initSelection]);

    const handleImageLoad = () => {
      if (imgRef.current) {
        setLayoutSize({ w: imgRef.current.width, h: imgRef.current.height });
      }
      if (!initializedRef.current) initSelection();
    };

    // ---------- pointer handlers ----------

    const handleContainerPointerDown = useCallback(
      (e: React.PointerEvent) => {
        // Only handle direct container clicks (not handle clicks which stopPropagation)
        if ((e.target as HTMLElement).dataset.handle) return;

        if (!snapBounds()) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        hasUserInteracted.current = true;

        const { boundsLeft, boundsTop, boundsW, boundsH } = drag.current;
        const nx = (e.clientX - boundsLeft) / boundsW;
        const ny = (e.clientY - boundsTop) / boundsH;
        const sel = selRef.current;

        if (
          sel &&
          nx >= sel.x &&
          nx <= sel.x + sel.w &&
          ny >= sel.y &&
          ny <= sel.y + sel.h
        ) {
          // Move mode
          drag.current = {
            ...drag.current,
            mode: "move",
            handle: "",
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startSelX: sel.x,
            startSelY: sel.y,
            startSelW: sel.w,
            startSelH: sel.h,
          };
        } else {
          // Draw mode
          const cx = clamp(nx, 0, 1);
          const cy = clamp(ny, 0, 1);
          drag.current = {
            ...drag.current,
            mode: "draw",
            handle: "",
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startSelX: cx,
            startSelY: cy,
            startSelW: 0,
            startSelH: 0,
          };
          syncSel({ x: cx, y: cy, w: 0, h: 0 });
        }
      },
      []
    );

    const handleHandlePointerDown = useCallback(
      (e: React.PointerEvent, handle: string) => {
        e.stopPropagation();
        const sel = selRef.current;
        if (!sel) return;
        if (!snapBounds()) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        hasUserInteracted.current = true;

        drag.current = {
          ...drag.current,
          mode: "resize",
          handle,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          startSelX: sel.x,
          startSelY: sel.y,
          startSelW: sel.w,
          startSelH: sel.h,
        };
      },
      []
    );

    // Single pointermove on window — but the handler never changes (no dep array churn)
    // Uses only refs, so React never re-renders during drag
    const handlePointerMove = useCallback((e: PointerEvent) => {
      const d = drag.current;
      if (d.mode === "idle") return;

      const { boundsW, boundsH, boundsLeft, boundsTop } = d;

      if (d.mode === "draw") {
        const mx = clamp((e.clientX - boundsLeft) / boundsW, 0, 1);
        const my = clamp((e.clientY - boundsTop) / boundsH, 0, 1);
        const sx = d.startSelX;
        const sy = d.startSelY;
        syncSel({
          x: Math.min(mx, sx),
          y: Math.min(my, sy),
          w: Math.abs(mx - sx),
          h: Math.abs(my - sy),
        });

      } else if (d.mode === "move") {
        const dx = (e.clientX - d.startMouseX) / boundsW;
        const dy = (e.clientY - d.startMouseY) / boundsH;
        syncSel({
          x: clamp(d.startSelX + dx, 0, 1 - d.startSelW),
          y: clamp(d.startSelY + dy, 0, 1 - d.startSelH),
          w: d.startSelW,
          h: d.startSelH,
        });

      } else if (d.mode === "resize") {
        const dx = (e.clientX - d.startMouseX) / boundsW;
        const dy = (e.clientY - d.startMouseY) / boundsH;
        let { startSelX: x, startSelY: y, startSelW: w, startSelH: h, handle } = d;

        if (handle.includes("r")) w = clamp(w + dx, 0.01, 1 - x);
        if (handle.includes("b")) h = clamp(h + dy, 0.01, 1 - y);
        if (handle.includes("l")) {
          const adx = clamp(dx, -x, w - 0.01);
          x += adx;
          w -= adx;
        }
        if (handle.includes("t")) {
          const ady = clamp(dy, -y, h - 0.01);
          y += ady;
          h -= ady;
        }
        syncSel({ x, y, w: clamp(w, 0, 1 - x), h: clamp(h, 0, 1 - y) });
      }
    }, []);

    const handlePointerUp = useCallback(() => {
      drag.current.mode = "idle";
    }, []);

    // Attach/detach once — handlers are stable refs so no churn
    useEffect(() => {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }, [handlePointerMove, handlePointerUp]);

    // ---------- crop ----------

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
        ctx.drawImage(
          imgRef.current,
          sx, sy, Math.min(cw, nw - sx), Math.min(ch, nh - sy),
          0, 0, cw, ch
        );
        setTimeout(() => onCrop(canvas.toDataURL("image/png")), 10);
      },
    }));

    // ---------- handle styles ----------

    const cornerHandles = ["tl", "tr", "bl", "br"];
    const edgeHandles = ["t", "r", "b", "l"];
    const handles = [...cornerHandles, ...edgeHandles];

    const getHandleStyle = (h: string): React.CSSProperties => {
      const isCorner = h.length === 2;
      // 44px transparent hit area, centered on the edge/corner
      const hitSize = 44;
      const hitOffset = -(hitSize / 2);
      const base: React.CSSProperties = {
        position: "absolute",
        width: hitSize,
        height: hitSize,
        background: "transparent",
        border: "none",
        zIndex: 50,
        touchAction: "none",
        cursor:
          h === "t" || h === "b" ? "ns-resize"
          : h === "l" || h === "r" ? "ew-resize"
          : h === "tl" || h === "br" ? "nwse-resize"
          : "nesw-resize",
        // Center the dot visually using a pseudo-element equivalent via box trick:
        // We draw the small visible dot via a centered inset box-shadow on a 0x0 element
        // Instead, we use display:flex to center a ::before-like inner dot
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      if (isCorner) {
        return {
          ...base,
          top: h.includes("t") ? hitOffset : "auto",
          bottom: h.includes("b") ? hitOffset : "auto",
          left: h.includes("l") ? hitOffset : "auto",
          right: h.includes("r") ? hitOffset : "auto",
        };
      }
      return {
        ...base,
        top: h === "t" ? hitOffset : h === "b" ? "auto" : "calc(50% - 22px)",
        bottom: h === "b" ? hitOffset : "auto",
        left: h === "l" ? hitOffset : h === "r" ? "auto" : "calc(50% - 22px)",
        right: h === "r" ? hitOffset : "auto",
      };
    };

    const getDotStyle = (h: string): React.CSSProperties => {
      const isCorner = h.length === 2;
      return {
        width: isCorner ? 9 : 7,
        height: isCorner ? 9 : 7,
        borderRadius: isCorner ? 2 : "50%",
        background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.2)",
        flexShrink: 0,
        pointerEvents: "none",
      };
    };

    const isMoving = drag.current.mode === "move";

    return (
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          userSelect: "none",
          touchAction: "none", // prevent browser scroll hijacking the whole container
          lineHeight: 0,
          maxWidth: "100%",
          borderRadius: 8,
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          // Force GPU compositing layer — smooth repaints during drag
          willChange: "transform",
        }}
        onPointerDown={handleContainerPointerDown}
      >
        <img
          ref={imgRef}
          src={image}
          alt="Crop target"
          style={{
            maxHeight: "80vh",
            maxWidth: "100%",
            width: "auto",
            height: "auto",
            display: "block",
            borderRadius: 8,
          }}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {selection && layoutSize.w > 0 && (
          <>
            {/* Dark overlay — 4 rects outside the selection */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: selection.y * layoutSize.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: (selection.y + selection.h) * layoutSize.h, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: selection.y * layoutSize.h, left: 0, width: selection.x * layoutSize.w, height: selection.h * layoutSize.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: selection.y * layoutSize.h, left: (selection.x + selection.w) * layoutSize.w, right: 0, height: selection.h * layoutSize.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
          </>
        )}

        {selection && layoutSize.w > 0 && (
          <div
            style={{
              position: "absolute",
              left: selection.x * layoutSize.w,
              top: selection.y * layoutSize.h,
              width: selection.w * layoutSize.w,
              height: selection.h * layoutSize.h,
              border: "1px solid rgba(255,255,255,0.85)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
              cursor: isMoving ? "grabbing" : "move",
              zIndex: 20,
              boxSizing: "border-box",
              // GPU layer for the selection box itself
              willChange: "left, top, width, height",
            }}
            data-crop-area="true"
          >
            {/* Rule-of-thirds grid */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)" }} />
              <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.2)" }} />
              <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)" }} />
              <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.2)" }} />
            </div>

            {/* Corner L-brackets */}
            {[
              { top: -1, left: -1, borderTop: "2px solid #fff", borderLeft: "2px solid #fff", width: 16, height: 16 },
              { top: -1, right: -1, borderTop: "2px solid #fff", borderRight: "2px solid #fff", width: 16, height: 16 },
              { bottom: -1, left: -1, borderBottom: "2px solid #fff", borderLeft: "2px solid #fff", width: 16, height: 16 },
              { bottom: -1, right: -1, borderBottom: "2px solid #fff", borderRight: "2px solid #fff", width: 16, height: 16 },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", pointerEvents: "none", ...s }} />
            ))}

            {/* Resize handles — large transparent hit area with small visible dot inside */}
            {handles.map((h) => (
              <div
                key={h}
                onPointerDown={(e) => handleHandlePointerDown(e, h)}
                style={getHandleStyle(h)}
                data-handle="true"
              >
                <div style={getDotStyle(h)} />
              </div>
            ))}
          </div>
        )}

        {/* Dimensions badge */}
        {selection && selection.w * layoutSize.w > 40 && selection.h * layoutSize.h > 40 && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              color: "white",
              fontSize: 10,
              fontFamily: "ui-monospace, monospace",
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid rgba(255,255,255,0.1)",
              zIndex: 60,
              pointerEvents: "none",
            }}
          >
            {(() => {
              const bw = Math.round(selection.w * (imgRef.current?.naturalWidth || 0));
              const bh = Math.round(selection.h * (imgRef.current?.naturalHeight || 0));
              return `${bw} × ${bh}`;
            })()}
          </div>
        )}
      </div>
    );
  }
);

ImageCropper.displayName = "ImageCropper";

export default ImageCropper;