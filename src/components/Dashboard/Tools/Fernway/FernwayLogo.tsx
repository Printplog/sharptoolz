import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

interface GuillocheRing {
  R: number;
  r: number;
  d: number;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function epitrochoidPath({ R, r, d }: GuillocheRing, segmentsPerLobe = 14): string {
  const divisor = gcd(R, r);
  const loops = r / divisor;
  const lobes = R / divisor;
  const steps = Math.max(120, lobes * segmentsPerLobe);
  const total = 2 * Math.PI * loops;
  const k = (R + r) / r;

  let path = "";
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * total;
    const x = (R + r) * Math.cos(t) - d * Math.cos(k * t);
    const y = (R + r) * Math.sin(t) - d * Math.sin(k * t);
    path += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return `${path}Z`;
}

const MARK_RING: GuillocheRing = { R: 20, r: 3, d: 9 };
const CARD_LAYERS = [
  { ring: { R: 110, r: 9, d: 40 }, copies: 2, strokeWidth: 0.65, opacity: 0.55 },
  { ring: { R: 70, r: 6, d: 26 }, copies: 2, strokeWidth: 0.55, opacity: 0.45 },
];

/** Official Fernway banknote guilloché rosette icon mark. */
export function FernwayMark({ className }: { className?: string }) {
  const path = useMemo(() => epitrochoidPath(MARK_RING), []);
  const extent = MARK_RING.R + MARK_RING.r + MARK_RING.d + 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
      className={cn("pointer-events-none shrink-0", className)}
      fill="none"
      stroke="currentColor"
    >
      <path d={path} strokeWidth={1.6} />
    </svg>
  );
}

/** Decorative Fernway card guilloché rosette backdrop. */
export function FernwayCardGuilloche({ className }: { className?: string }) {
  const id = useId();
  const paths = useMemo(() => CARD_LAYERS.map((layer) => epitrochoidPath(layer.ring)), []);
  const extent = Math.max(...CARD_LAYERS.map((l) => l.ring.R + l.ring.r + l.ring.d)) + 2;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
      className={cn("pointer-events-none", className)}
      fill="none"
      stroke="currentColor"
    >
      <defs>
        {paths.map((d, index) => (
          <path key={index} id={`${id}-ring-${index}`} d={d} />
        ))}
      </defs>
      {CARD_LAYERS.flatMap((layer, index) =>
        Array.from({ length: layer.copies }, (_, copy) => (
          <use
            key={`${index}-${copy}`}
            href={`#${id}-ring-${index}`}
            strokeWidth={layer.strokeWidth}
            opacity={layer.opacity}
            transform={`rotate(${(copy * 360) / (layer.ring.R * layer.copies)})`}
          />
        ))
      )}
    </svg>
  );
}

/** Official Fernway logo lockup (rosette mark + Fernway wordmark). */
export function FernwayLogo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <FernwayMark className={cn("size-6 text-emerald-400", markClassName)} />
      <span className={cn("font-semibold tracking-tight text-white text-base", textClassName)}>
        Fernway
      </span>
    </span>
  );
}
