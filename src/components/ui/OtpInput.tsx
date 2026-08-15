import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
};

/**
 * Segmented one-time-code field. A single transparent input sits on top of the
 * slots so paste, SMS/authenticator autofill and the numeric mobile keyboard all
 * behave natively — the boxes underneath are purely presentational.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = false,
  id,
}: OtpInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // The caret always sits at the end of what's typed; slots fill left to right.
  const activeIndex = Math.min(value.length, length - 1);

  const pinCaretToEnd = () => {
    const input = inputRef.current;
    if (!input) return;
    const end = input.value.length;
    if (input.selectionStart !== end || input.selectionEnd !== end) {
      input.setSelectionRange(end, end);
    }
  };

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, length);
    if (digits === value) return;
    onChange(digits);
    if (digits.length === length) onComplete?.(digits);
  };

  return (
    <div className={cn("relative", disabled && "opacity-50")}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(event) => handleChange(event.target.value)}
        onFocus={() => {
          setFocused(true);
          pinCaretToEnd();
        }}
        onBlur={() => setFocused(false)}
        onSelect={pinCaretToEnd}
        onClick={pinCaretToEnd}
        className="absolute inset-0 z-10 h-full w-full cursor-default text-transparent caret-transparent opacity-0 outline-none"
        aria-label={`Enter the ${length}-digit code`}
      />
      <div className="flex items-center gap-2" aria-hidden="true">
        {Array.from({ length }, (_, index) => {
          const char = value[index];
          const isActive = focused && !disabled && index === activeIndex;
          return (
            <div
              key={index}
              className={cn(
                "relative flex h-12 flex-1 select-none items-center justify-center rounded-xl border bg-white/[0.03] font-mono text-lg text-white transition-colors",
                char ? "border-white/20" : "border-white/10",
                isActive && "border-[#cee88c]/60 bg-[#cee88c]/[0.06]",
              )}
            >
              {char ?? (isActive ? null : <span className="text-white/15">·</span>)}
              {isActive && !char && (
                <span className="absolute h-5 w-px animate-pulse bg-[#cee88c]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
