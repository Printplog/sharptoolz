import { cn } from "@/lib/utils";

/**
 * Bespoke staggered-bars + lime-dot menu trigger for the top navbar.
 * Morphs cleanly into a close mark when the mobile drawer is open.
 */
export function SharpMenuIcon({
  open = false,
  className,
}: {
  open?: boolean;
  className?: string;
}) {
  if (open) {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={cn("size-5 transition-transform duration-200", className)}
      >
        <path
          d="M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 transition-transform duration-200", className)}
    >
      <rect x="2.75" y="4.25" width="14.5" height="1.9" rx="0.95" fill="currentColor" />
      <rect x="2.75" y="9.05" width="9.5" height="1.9" rx="0.95" fill="currentColor" opacity="0.82" />
      <circle cx="15.6" cy="10" r="1.65" className="fill-primary" />
      <rect x="2.75" y="13.85" width="11.8" height="1.9" rx="0.95" fill="currentColor" opacity="0.62" />
    </svg>
  );
}

/**
 * Bespoke asymmetric bento-grid icon for the bottom bar's Menu/More trigger.
 */
export function BentoMenuIcon({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={cn("size-5 transition-transform duration-200", className)}
    >
      <rect
        x="2.75"
        y="2.75"
        width="6"
        height="6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <rect
        x="11.25"
        y="2.75"
        width="6"
        height="6"
        rx="3"
        className={active ? "fill-primary stroke-primary" : "fill-primary/25 stroke-primary"}
        strokeWidth="1.5"
      />
      <rect
        x="2.75"
        y="11.25"
        width="6"
        height="6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <rect
        x="11.25"
        y="11.25"
        width="6"
        height="6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.65"
      />
    </svg>
  );
}
