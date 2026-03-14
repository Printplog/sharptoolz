import React, { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";

interface Selection {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageCropperProps {
  image: string;
  onCrop: (dataUrl: string) => void;
  initialSelection?: { x: number, y: number, w: number, h: number };
}

export interface ImageCropperRef {
  crop: () => void;
}

const ImageCropper = forwardRef<ImageCropperRef, ImageCropperProps>(({ image, onCrop, initialSelection }, ref) => {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [layoutSize, setLayoutSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number, y: number, mouseX?: number, mouseY?: number, orig?: Selection }>({ x: 0, y: 0 });
  const initializedRef = useRef(false);
  const hasUserInteracted = useRef(false);


  const getScaledRect = useCallback(() => {
    const img = imgRef.current;
    if (!img) return { scaleX: 1, scaleY: 1, bounds: { left: 0, top: 0, width: 0, height: 0 } };
    const bounds = img.getBoundingClientRect();
    const w = bounds.width || 1;
    const h = bounds.height || 1;
    return {
      scaleX: img.naturalWidth / w,
      scaleY: img.naturalHeight / h,
      bounds,
    };
  }, []);

  // Core initializer — called once we know the image has real layout dimensions
  const initSelection = useCallback(() => {
    if (hasUserInteracted.current) return;
    
    if (initialSelection) {
      setSelection({
        x: initialSelection.x,
        y: initialSelection.y,
        w: initialSelection.w,
        h: initialSelection.h,
      });
    } else {
      // Default: select the entire image
      setSelection({ x: 0, y: 0, w: 1, h: 1 });
    }
    initializedRef.current = true;
  }, [initialSelection]);

  // Handle late-arriving initialSelection (e.g. from AI detection)
  useEffect(() => {
    if (initialSelection && !initializedRef.current && !hasUserInteracted.current) {
      initSelection();
    }
  }, [initialSelection, initSelection]);

  // When the image src changes, reset so we re-initialize
  useEffect(() => {
    initializedRef.current = false;
    hasUserInteracted.current = false;
    setSelection(null);
  }, [image, initialSelection]);

  // Use ResizeObserver to catch the moment the image gets real dimensions
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new ResizeObserver(() => {
      if (img.width > 0 && img.height > 0) {
        setLayoutSize({ w: img.width, h: img.height });
        if (!initializedRef.current) {
          initSelection();
        }
      }
    });

    observer.observe(img);

    // Also try immediately
    if (img.width > 0 && img.height > 0) {
      setLayoutSize({ w: img.width, h: img.height });
      if (!initializedRef.current) {
        initSelection();
      }
    }

    return () => observer.disconnect();
  }, [image, initSelection]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setLayoutSize({ w: imgRef.current.width, h: imgRef.current.height });
    }
    if (!initializedRef.current) {
      initSelection();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // @ts-ignore
    if (e.target.dataset.handle) return;
    const { bounds } = getScaledRect();
    const x = (e.clientX - bounds.left) / bounds.width;
    const y = (e.clientY - bounds.top) / bounds.height;
    if (selection &&
        x >= selection.x && x <= selection.x + selection.w &&
        y >= selection.y && y <= selection.y + selection.h) {
      setMoving(true);
      hasUserInteracted.current = true;
      startRef.current = { x: selection.x, y: selection.y, mouseX: e.clientX, mouseY: e.clientY };
    } else {
      startRef.current = { x, y };
      setDragging(true);
      hasUserInteracted.current = true;
      setSelection({ x, y, w: 0, h: 0 });
    }
  };

  const handleHandlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (!selection) return;
    startRef.current = {
      x: 0,
      y: 0,
      mouseX: e.clientX,
      mouseY: e.clientY,
      orig: { ...selection },
    };
    setResizing(handle);
    hasUserInteracted.current = true;
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const { bounds } = getScaledRect();
      if (!bounds.width) return;
      const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

      if (moving) {
        const { mouseX, mouseY, x: sx, y: sy } = startRef.current;
        if (mouseX === undefined || mouseY === undefined) return;
        const dx = (e.clientX - mouseX) / bounds.width;
        const dy = (e.clientY - mouseY) / bounds.height;
        setSelection(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            x: clamp(sx + dx, 0, 1 - prev.w),
            y: clamp(sy + dy, 0, 1 - prev.h)
          };
        });
      } else if (dragging) {
        const mx = clamp((e.clientX - bounds.left) / bounds.width, 0, 1);
        const my = clamp((e.clientY - bounds.top) / bounds.height, 0, 1);
        const { x: sx, y: sy } = startRef.current;
        setSelection({
          x: Math.min(mx, sx),
          y: Math.min(my, sy),
          w: Math.abs(mx - sx),
          h: Math.abs(my - sy)
        });
      } else if (resizing && startRef.current.orig) {
        const { mouseX, mouseY, orig } = startRef.current;
        if (mouseX === undefined || mouseY === undefined || !orig) return;
        const dx = (e.clientX - mouseX) / bounds.width;
        const dy = (e.clientY - mouseY) / bounds.height;
        let { x, y, w, h } = orig;

        if (resizing.includes("r")) w = clamp(w + dx, 0.01, 1 - x);
        if (resizing.includes("b")) h = clamp(h + dy, 0.01, 1 - y);
        if (resizing.includes("l")) {
          const actualDx = clamp(dx, -x, w - 0.01);
          x += actualDx;
          w -= actualDx;
        }
        if (resizing.includes("t")) {
          const actualDy = clamp(dy, -y, h - 0.01);
          y += actualDy;
          h -= actualDy;
        }

        setSelection({ x, y, w: clamp(w, 0, 1-x), h: clamp(h, 0, 1-y) });
      }
    },
    [moving, dragging, resizing, getScaledRect]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setResizing(null);
    setMoving(false);
  }, []);

  useEffect(() => {
    if (dragging || resizing || moving) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, resizing, moving, handlePointerMove, handlePointerUp]);

  useImperativeHandle(ref, () => ({
    crop: () => {
      if (!selection || !imgRef.current) return;
      const nw = imgRef.current.naturalWidth;
      const nh = imgRef.current.naturalHeight;
      const cw = Math.max(1, Math.round(selection.w * nw));
      const ch = Math.max(1, Math.round(selection.h * nh));
      const sx = Math.max(0, Math.min(nw - (cw / 100), Math.round(selection.x * nw)));
      const sy = Math.max(0, Math.min(nh - (ch / 100), Math.round(selection.y * nh)));

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        imgRef.current,
        sx, sy, Math.min(cw, nw - sx), Math.min(ch, nh - sy), 
        0, 0, cw, ch
      );

      // Async to allow dialog to snap shut quickly
      setTimeout(() => {
        onCrop(canvas.toDataURL("image/png"));
      }, 10);
    }
  }));

  const cornerHandles = ["tl", "tr", "bl", "br"];
  const edgeHandles = ["t", "r", "b", "l"];
  const handles = [...cornerHandles, ...edgeHandles];

  const getHandleStyle = (h: string): React.CSSProperties => {
    const isCorner = h.length === 2;
    const size = isCorner ? 10 : 8;
    const offset = isCorner ? -5 : -4;

    const base: React.CSSProperties = {
      position: "absolute",
      width: size,
      height: size,
      background: "#fff",
      border: "1.5px solid rgba(255,255,255,0.9)",
      borderRadius: isCorner ? 2 : "50%",
      zIndex: 50,
      cursor:
        h === "t" || h === "b" ? "ns-resize"
        : h === "l" || h === "r" ? "ew-resize"
        : h === "tl" || h === "br" ? "nwse-resize"
        : "nesw-resize",
      boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
    };

    if (isCorner) {
      return {
        ...base,
        top: h.includes("t") ? offset : "auto",
        bottom: h.includes("b") ? offset : "auto",
        left: h.includes("l") ? offset : "auto",
        right: h.includes("r") ? offset : "auto",
      };
    } else {
      return {
        ...base,
        top: h === "t" ? offset : h === "b" ? "auto" : "calc(50% - 4px)",
        bottom: h === "b" ? offset : "auto",
        left: h === "l" ? offset : h === "r" ? "auto" : "calc(50% - 4px)",
        right: h === "r" ? offset : "auto",
      };
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-block",
        userSelect: "none",
        touchAction: "none",
        lineHeight: 0,
        maxWidth: "100%",
        borderRadius: 8,
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
      }}
      onPointerDown={handlePointerDown}
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

        {/* Dark overlay outside selection */}
        {selection && layoutSize.w > 0 && (
          <>
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
              cursor: moving ? "grabbing" : "move",
              zIndex: 20,
              boxSizing: "border-box",
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

            {/* Resize handles */}
            {handles.map((h) => (
              <div
                key={h}
                onPointerDown={(e) => handleHandlePointerDown(e, h)}
                style={getHandleStyle(h)}
                data-handle="true"
              />
            ))}
          </div>
        )}
      {/* Dimensions badge inside the container */}
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
});

ImageCropper.displayName = "ImageCropper";

export default ImageCropper;