import { useState } from "react";

import { flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

type Props = {
  code: string;
  className?: string;
};

/** A small flag for a 2-letter country code; shows the code if the image can't load. */
export function CountryFlag({ code, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "inline-flex h-4 w-6 shrink-0 items-center justify-center rounded-[3px] bg-white/10 text-[9px] font-bold text-white/60",
          className,
        )}
        aria-hidden
      >
        {code.toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={flagUrl(code, 40)}
      srcSet={`${flagUrl(code, 40)} 1x, ${flagUrl(code, 80)} 2x`}
      alt=""
      aria-hidden
      loading="lazy"
      // CORS mode so the flag still loads on pages sent with Cross-Origin-Embedder-Policy
      crossOrigin="anonymous"
      onError={() => setFailed(true)}
      className={cn("h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-white/10", className)}
    />
  );
}
