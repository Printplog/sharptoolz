"use client";
/**
 * SVGConnector.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for DivConnector in ReferralAnnouncement.tsx.
 * Draws an L-shaped SVG path between the referral step cards and animates a
 * glowing dot + progressive track-draw travelling along the path.
 *
 * Usage:
 *   <SVGConnector
 *     progress={progress}           // Framer Motion MotionValue<number> 0→1
 *     range={[0.30, 0.45]}          // slice of global cycle this connector owns
 *     type="top-right" | "top-left" // which direction the L-bend goes
 *     color="#f97316"               // dot / track colour (start)
 *     colorEnd="#3b82f6"            // track colour (end of gradient)
 *   />
 */

import { useRef, useEffect, useId } from "react";
import { useTransform, useMotionValueEvent } from "framer-motion";
import type { MotionValue } from "framer-motion";

interface SVGConnectorProps {
  progress: MotionValue<number>;
  range: [number, number];
  type: "top-right" | "top-left";
  color?: string;
  colorEnd?: string;
}

const HEIGHT = 160; // connector vertical span in px
const CORNER = 36;  // SVG quadratic curve radius

export function SVGConnector({
  progress,
  range,
  type,
  color = "#f97316",
  colorEnd = "#3b82f6",
}: SVGConnectorProps) {
  const uid = useId().replace(/:/g, ""); // safe for SVG id attrs

  // Refs for SVG elements we mutate imperatively (avoids React re-renders on every frame)
  const wrapRef     = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<SVGPathElement>(null); // faint static track
  const drawRef     = useRef<SVGPathElement>(null); // animated draw-on path
  const dotRef      = useRef<SVGCircleElement>(null);
  const glowRef     = useRef<SVGCircleElement>(null);
  const lengthRef   = useRef(0);
  const widthRef    = useRef(0);

  /** Build the L-shaped path for a given container width */
  function makePath(w: number): string {
    const cx = w / 2;
    const offset = Math.min(w * 0.22, 120); // horizontal offset of the elbow

    if (type === "top-right") {
      // ─────╮
      //      │
      const ex = cx + offset;
      return [
        `M ${cx} 0`,
        `L ${ex - CORNER} 0`,
        `Q ${ex} 0 ${ex} ${CORNER}`,
        `L ${ex} ${HEIGHT}`,
      ].join(" ");
    } else {
      // ╭─────
      // │
      const ex = cx - offset;
      return [
        `M ${cx} 0`,
        `L ${ex + CORNER} 0`,
        `Q ${ex} 0 ${ex} ${CORNER}`,
        `L ${ex} ${HEIGHT}`,
      ].join(" ");
    }
  }

  /** Sync both path elements' `d` and the dasharray to current container width */
  function syncPath() {
    if (!wrapRef.current || !trackRef.current || !drawRef.current) return;
    const w = wrapRef.current.offsetWidth;
    if (w === widthRef.current) return; // no-op if width hasn't changed
    widthRef.current = w;

    const d = makePath(w);
    trackRef.current.setAttribute("d", d);
    drawRef.current.setAttribute("d", d);

    const len = trackRef.current.getTotalLength();
    lengthRef.current = len;

    // Prime the draw path to be fully hidden
    drawRef.current.style.strokeDasharray  = String(len);
    drawRef.current.style.strokeDashoffset = String(len);
  }

  // Measure on mount + on every resize
  useEffect(() => {
    syncPath();
    const ro = new ResizeObserver(syncPath);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Map global progress [range[0]..range[1]] → local 0..1 (clamped)
  const localT = useTransform(progress, range, [0, 1], { clamp: true });

  useMotionValueEvent(localT, "change", (t) => {
    const len = lengthRef.current;
    if (!len || !trackRef.current || !drawRef.current || !dotRef.current || !glowRef.current) return;

    // ── progressive draw ───────────────────────────────────────────────────
    const drawn = t * len;
    drawRef.current.style.strokeDashoffset = String(len - drawn);

    // ── dot position along the path ────────────────────────────────────────
    const pt = trackRef.current.getPointAtLength(drawn);
    const cx = String(pt.x);
    const cy = String(pt.y);
    dotRef.current.setAttribute("cx", cx);
    dotRef.current.setAttribute("cy", cy);
    glowRef.current.setAttribute("cx", cx);
    glowRef.current.setAttribute("cy", cy);

    // ── fade in / out ──────────────────────────────────────────────────────
    const fade = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1;
    dotRef.current.style.opacity  = String(fade);
    glowRef.current.style.opacity = String(fade * 0.5);
  });

  const gradId  = `sg-${uid}`;
  const filterId = `gf-${uid}`;

  return (
    <div
      ref={wrapRef}
      className="w-full max-w-7xl mx-auto pointer-events-none"
      style={{
        height: HEIGHT,
        // Overlap the cards above and below by half the connector height
        marginTop:    -(HEIGHT / 2),
        marginBottom: -(HEIGHT / 2),
        position: "relative",
        zIndex: 5,
      }}
    >
      <svg
        width="100%"
        height={HEIGHT}
        style={{ overflow: "visible", position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Gradient along the track */}
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={color} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>

          {/* Glow filter for the dot */}
          <filter id={filterId} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Faint static track ─────────────────────────────────────────── */}
        <path
          ref={trackRef}
          d=""
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* ── Animated lit-up portion ────────────────────────────────────── */}
        <path
          ref={drawRef}
          d=""
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            // dasharray / dashoffset set imperatively after path measurement
          }}
        />

        {/* ── Outer glow blob ────────────────────────────────────────────── */}
        <circle
          ref={glowRef}
          r={18}
          fill={color}
          opacity={0}
          style={{ filter: "blur(12px)" }}
        />

        {/* ── Sharp travelling dot ───────────────────────────────────────── */}
        <circle
          ref={dotRef}
          r={4.5}
          fill={color}
          opacity={0}
          filter={`url(#${filterId})`}
        />
      </svg>
    </div>
  );
}