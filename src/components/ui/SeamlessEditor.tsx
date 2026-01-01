import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface SeamlessEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SeamlessEditor({ value, onChange, className, placeholder }: SeamlessEditorProps) {
  // Initialize lines from value
  const [lines, setLines] = useState<string[]>(value ? value.split('\n') : ['']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Sync internal state if external value changes drastically (e.g. from undo/redo or selection change)
  // We need to be careful not to override typing state, so we might check if they differ significantly
  useEffect(() => {
    const joined = lines.join('\n');
    if (value !== joined) {
       setLines(value ? value.split('\n') : ['']);
    }
  }, [value]);

  const updateParent = (newLines: string[]) => {
    onChange(newLines.join('\n'));
  };

  const handleChange = (index: number, newValue: string) => {
    const newLines = [...lines];
    newLines[index] = newValue;
    setLines(newLines);
    updateParent(newLines);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const currentLine = lines[index];
      const selectionStart = e.currentTarget.selectionStart || 0;
      
      // Split the line at cursor
      const part1 = currentLine.substring(0, selectionStart);
      const part2 = currentLine.substring(selectionStart);
      
      const newLines = [...lines];
      newLines[index] = part1;
      newLines.splice(index + 1, 0, part2);
      
      setLines(newLines);
      updateParent(newLines);
      
      // Format: Focus next line after render
      setTimeout(() => {
         // Focus the start of the new line
         if (inputRefs.current[index + 1]) {
           inputRefs.current[index + 1]?.focus();
           inputRefs.current[index + 1]?.setSelectionRange(0, 0);
         }
      }, 0);
    } else if (e.key === 'Backspace') {
      const selectionStart = e.currentTarget.selectionStart || 0;
      
      // Merge with previous line if at start and not first line
      if (selectionStart === 0 && index > 0) {
        e.preventDefault();
        
        const prevLine = lines[index - 1];
        const currentLine = lines[index];
        
        const newLines = [...lines];
        newLines[index - 1] = prevLine + currentLine;
        newLines.splice(index, 1);
        
        setLines(newLines);
        updateParent(newLines);
        
        setTimeout(() => {
          if (inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
            // Set caret to where merge happened
            inputRefs.current[index - 1]?.setSelectionRange(prevLine.length, prevLine.length);
          }
        }, 0);
      }
    } else if (e.key === 'ArrowUp') {
      if (index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      if (index < lines.length - 1) {
         e.preventDefault();
         inputRefs.current[index + 1]?.focus();
      }
    }
  };

  return (
    <div className={cn("flex flex-col w-full bg-white/10 border border-white/20 rounded-md overflow-hidden p-2 gap-0.5", className)}>
      {lines.map((line, i) => (
        <input
          key={i} // Using index as key is risky for moves but ok for simple append/splice in this controlled context
          ref={(el) => { inputRefs.current[i] = el; }}
          value={line}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="w-full bg-transparent border-none outline-none text-sm text-white p-0.5 focus:bg-white/5 rounded px-1"
          placeholder={i === 0 && lines.length === 1 ? placeholder : undefined}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
