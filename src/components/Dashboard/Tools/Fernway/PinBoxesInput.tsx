import { useRef, useState } from "react";
import { Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PinBoxesInputProps {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  onGenerate?: () => void;
  disabled?: boolean;
  defaultVisible?: boolean;
}

export function PinBoxesInput({
  id = "fw-transaction-pin",
  value,
  onChange,
  onGenerate,
  disabled = false,
  defaultVisible = true,
}: PinBoxesInputProps) {
  const [visible, setVisible] = useState(defaultVisible);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 4 }, (_, idx) => value[idx] ?? "");

  const updateDigit = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      onChange(next.join(""));
      return;
    }

    const next = [...digits];
    let cursor = index;
    for (const ch of clean) {
      if (cursor >= 4) break;
      next[cursor] = ch;
      cursor += 1;
    }
    onChange(next.join(""));
    refs.current[Math.min(cursor, 3)]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        onChange(next.join(""));
        e.preventDefault();
      } else if (index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        onChange(next.join(""));
        refs.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, 3)]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            id={index === 0 ? id : `${id}-${index}`}
            data-pin-box=""
            ref={(el) => {
              refs.current[index] = el;
            }}
            type={visible ? "text" : "password"}
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            disabled={disabled}
            value={digit}
            onChange={(e) => updateDigit(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Transaction PIN digit ${index + 1}`}
            className={`size-12 rounded-xl border text-center font-mono text-lg font-semibold text-white bg-white/10 transition-colors outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
              digit ? "border-primary/50" : "border-white/20"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide PIN" : "Show PIN"}
          title={visible ? "Hide PIN" : "Show PIN"}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {onGenerate && (
          <Button
            type="button"
            onClick={() => {
              onGenerate();
              setVisible(true);
            }}
            disabled={disabled}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4"
            title="Generate random 4-digit PIN"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Generate
          </Button>
        )}
      </div>
    </div>
  );
}
