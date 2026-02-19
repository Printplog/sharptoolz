import { forwardRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface EditableInputProps {
  value: string;
  onInput: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
}

const EditableInput = forwardRef<HTMLDivElement, EditableInputProps>(({
  value,
  onInput,
  onFocus,
  onBlur,
  onKeyDown,
  disabled,
  hasError,
  placeholder,
  className,
}, ref) => {
  useEffect(() => {
    if (typeof ref === 'object' && ref?.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value, ref]);

  return (
    <>
      <div
        ref={ref}
        role="textbox"
        contentEditable={!disabled}
        spellCheck={false}
        onInput={onInput}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={cn(
          "min-h-[44px] rounded-md border bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-0",
          hasError
            ? "border-red-500/50 focus-visible:border-red-500/50"
            : "border-white/20 focus-visible:border-white/40",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      />
      {!value && placeholder && (
        <div className="pointer-events-none absolute left-3 top-2 text-sm text-white/40">
          {placeholder}
        </div>
      )}
    </>
  );
});

EditableInput.displayName = "EditableInput";

export default EditableInput;

