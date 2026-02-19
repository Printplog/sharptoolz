import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { generateValue } from "@/lib/utils/fieldGenerator";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface GenRuleBuilderProps {
  value: string;
  onChange: (value: string) => void;
  allElements?: SvgElement[];
  maxLength?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  currentFieldValues?: Record<string, string>; // Current field values from the page
  defaultTextContent?: string; // Default text content of the element
}

type RandomType = 'number' | 'letter' | 'both';
type RandomCase = 'uppercase' | 'lowercase' | 'mixed';

type PatternPart =
  | { type: 'static'; value: string }
  | { type: 'dep'; fieldName: string; extraction?: string }
  | { type: 'random'; randomType: RandomType; case?: RandomCase; count: number }
  | { type: 'repeat'; char: string; count: number }
  | { type: 'fill'; char: string };

export default function GenRuleBuilder({
  value,
  onChange,
  allElements = [],
  maxLength,
  open,
  onOpenChange,
  trigger,
  currentFieldValues = {},
  defaultTextContent,
}: GenRuleBuilderProps) {
  const [isAuto, setIsAuto] = useState<boolean>(() => value?.startsWith("AUTO:") || false);
  // Strip AUTO: prefix before parsing to avoid showing it as a rule
  const patternWithoutAuto = value?.startsWith("AUTO:") ? value.substring(5) : value;
  const [parts, setParts] = useState<PatternPart[]>(() => parsePattern(patternWithoutAuto || ""));
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [countInputs, setCountInputs] = useState<Record<number, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset parts when value changes externally
  useEffect(() => {
    if (!open) {
      // Strip AUTO: prefix before parsing to avoid showing it as a rule
      const patternWithoutAuto = value?.startsWith("AUTO:") ? value.substring(5) : value;
      setParts(parsePattern(patternWithoutAuto || ""));
      setCountInputs({}); // Clear count inputs when dropdown closes
      setIsAuto(value?.startsWith("AUTO:") || false);
    }
  }, [value, open]);

  // Extract all base IDs for dependency suggestions
  const availableFields = useMemo(() => {
    const fields = new Set<string>();
    allElements.forEach(el => {
      if (el.id) {
        const firstDotIndex = el.id.indexOf(".");
        if (firstDotIndex > 0) {
          const baseId = el.id.substring(0, firstDotIndex);
          fields.add(baseId);
        }
      }
    });
    return Array.from(fields).sort();
  }, [allElements]);

  // Generate preview using current field values
  const preview = useMemo(() => {
    try {
      const basePattern = buildPattern(parts);
      const pattern = isAuto ? `AUTO:${basePattern}` : basePattern;
      const previewFields: Record<string, string> = {};

      // Use current field values if available, otherwise use sample values
      availableFields.forEach(field => {
        // Try to get current value from currentFieldValues first
        if (currentFieldValues[field] !== undefined) {
          previewFields[field] = String(currentFieldValues[field]);
        } else {
          // Fallback to sample value
          previewFields[field] = `Sample_${field}`;
        }
      });

      return generateValue(pattern, previewFields, maxLength);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Invalid pattern'}`;
    }
  }, [parts, availableFields, maxLength, currentFieldValues, isAuto]);

  const handleAddPart = useCallback((type: PatternPart['type']) => {
    const newPart: PatternPart =
      type === 'static' ? { type: 'static', value: '' }
        : type === 'dep' ? { type: 'dep', fieldName: '' }
          : type === 'random' ? { type: 'random', randomType: 'number', count: 1 }
            : type === 'repeat' ? { type: 'repeat', char: '', count: 1 }
              : { type: 'fill', char: '' };

    const newParts = [...parts, newPart];
    setParts(newParts);
    setEditingIndex(newParts.length - 1);
  }, [parts]);

  const handleUpdatePart = useCallback((index: number, updates: Partial<PatternPart>) => {
    setParts(parts.map((p, i) => i === index ? { ...p, ...updates } as PatternPart : p));
  }, [parts]);

  const handleRemovePart = useCallback((index: number) => {
    setParts(parts.filter((_, i) => i !== index));
    // Clean up count inputs for removed and shifted indices
    setCountInputs(prev => {
      const next = { ...prev };
      delete next[index];
      // Shift indices for items after the removed one
      Object.keys(next).forEach(key => {
        const idx = parseInt(key);
        if (idx > index) {
          next[idx - 1] = next[idx];
          delete next[idx];
        }
      });
      return next;
    });
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }, [parts, editingIndex]);

  const handleApply = useCallback(() => {
    const basePattern = buildPattern(parts);
    const finalPattern = isAuto ? `AUTO:${basePattern}` : basePattern;
    onChange(finalPattern);
    onOpenChange(false);
  }, [parts, isAuto, onChange, onOpenChange]);

  const handleCancel = useCallback(() => {
    // Strip AUTO: prefix before parsing to avoid showing it as a rule
    const patternWithoutAuto = value?.startsWith("AUTO:") ? value.substring(5) : value;
    setParts(parsePattern(patternWithoutAuto || "")); // Reset to original value
    onOpenChange(false);
  }, [value, onOpenChange]);

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        className={cn(
          "w-[700px] max-w-[90vw] h-[350px]",
          "bg-black/95 backdrop-blur-sm border-white/20",
          "p-3 shadow-xl text-white flex flex-col",
          "z-[100] overflow-y-auto custom-scrollbar"
        )}
      >
        <div className="mb-2 flex flex-col gap-1 shrink-0">
          <div className="text-sm font-semibold text-white">
            Generation Rule Builder
          </div>
          {defaultTextContent && (
            <div className="text-xs text-white/60 flex items-center gap-2">
              <span>Default text:</span>
              <span className="font-mono text-white/80 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {defaultTextContent}
              </span>
            </div>
          )}
        </div>

        {/* Cheatsheet Collapsible */}
        <div className="px-3 pb-2 shrink-0">
          <details className="group">
            <summary className="text-[10px] text-white/40 cursor-pointer hover:text-white/60 transition-colors list-none flex items-center gap-1 select-none">
              <span className="group-open:rotate-90 transition-transform">▸</span>
              <span>Syntax Cheatsheet</span>
            </summary>
            <div className="mt-2 text-[10px] text-white/50 grid grid-cols-2 gap-x-4 gap-y-1 p-2 bg-white/5 rounded border border-white/10">
              <div><span className="text-blue-300">rn[5]</span> - 5 random numbers</div>
              <div><span className="text-green-300">rc[5]</span> - 5 random chars (mixed)</div>
              <div><span className="text-green-300">ru[5]</span> - 5 random chars (UPPER)</div>
              <div><span className="text-green-300">rl[5]</span> - 5 random chars (lower)</div>
              <div><span className="text-purple-300">dep_ID</span> - Value from field ID</div>
              <div><span className="text-purple-300">dep_ID[w1]</span> - 1st word from field</div>
              <div><span className="text-orange-300">A[5]</span> - Repeat 'A' 5 times</div>
              <div><span className="text-yellow-300">&lt;[fill]</span> - Fill remaining space</div>
            </div>
          </details>
        </div>

        {/* Two Column Layout */}
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Left Section - Rules */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-white/60 text-xs mb-2 shrink-0">Rules</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {parts.length === 0 ? (
                <div className="text-white/40 text-sm text-center py-4">No parts yet. Click buttons to add.</div>
              ) : (
                parts.map((part, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md border border-white/10 bg-white/5"
                  >
                    <div className="flex-1 min-w-0">
                      {part.type === 'static' && (
                        <input
                          ref={index === editingIndex ? inputRef : null}
                          type="text"
                          value={part.value}
                          onChange={(e) => handleUpdatePart(index, { value: e.target.value })}
                          onFocus={() => setEditingIndex(index)}
                          placeholder="Static text"
                          className="w-full px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40"
                        />
                      )}

                      {part.type === 'dep' && (
                        <div className="flex gap-1">
                          <Select
                            value={part.fieldName}
                            onValueChange={(value) => handleUpdatePart(index, { fieldName: value })}
                          >
                            <SelectTrigger className="flex-1 h-8 text-xs bg-white/10 border-white/20 text-white focus:ring-0 focus:border-white/40">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent className="bg-black/95 border-white/20 z-[101]">
                              {availableFields.map(field => (
                                <SelectItem key={field} value={field} className="text-white">
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="text"
                            value={part.extraction || ''}
                            onChange={(e) => handleUpdatePart(index, { extraction: e.target.value })}
                            placeholder="w1, ch1-4"
                            className="w-20 px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-xs placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40"
                          />
                        </div>
                      )}

                      {part.type === 'random' && (
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <Select
                              value={part.randomType}
                              onValueChange={(value) => {
                                const updates: Partial<PatternPart> = { randomType: value as RandomType };
                                // Reset case if switching to number
                                if (value === 'number') {
                                  updates.case = undefined;
                                } else if (!part.case) {
                                  // Default to mixed if no case set
                                  updates.case = 'mixed';
                                }
                                handleUpdatePart(index, updates);
                              }}
                            >
                              <SelectTrigger className="flex-1 h-8 text-xs bg-white/10 border-white/20 text-white focus:ring-0 focus:border-white/40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-black/95 border-white/20 z-[101]">
                                <SelectItem value="number" className="text-white">Number</SelectItem>
                                <SelectItem value="letter" className="text-white">Letter</SelectItem>
                                <SelectItem value="both" className="text-white">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            {(part.randomType === 'letter' || part.randomType === 'both') && (
                              <Select
                                value={part.case || 'mixed'}
                                onValueChange={(value) => handleUpdatePart(index, { case: value as RandomCase })}
                              >
                                <SelectTrigger className="w-24 h-8 text-xs bg-white/10 border-white/20 text-white focus:ring-0 focus:border-white/40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black/95 border-white/20 z-[101]">
                                  <SelectItem value="uppercase" className="text-white">Uppercase</SelectItem>
                                  <SelectItem value="lowercase" className="text-white">Lowercase</SelectItem>
                                  <SelectItem value="mixed" className="text-white">Mixed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <input
                            type="text"
                            value={countInputs[index] !== undefined ? countInputs[index] : part.count.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Update local state to allow empty string
                              setCountInputs(prev => ({ ...prev, [index]: inputValue }));

                              // Only update part if it's a valid positive integer
                              if (inputValue === '') {
                                return; // Allow empty temporarily
                              }
                              const num = parseInt(inputValue);
                              if (!isNaN(num) && num > 0) {
                                handleUpdatePart(index, { count: num });
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              const num = parseInt(inputValue);
                              // Ensure at least 1 on blur if empty or invalid
                              if (isNaN(num) || num < 1) {
                                handleUpdatePart(index, { count: 1 });
                                setCountInputs(prev => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                              } else {
                                // Clear local state if valid
                                setCountInputs(prev => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                              }
                            }}
                            onFocus={() => {
                              // Initialize local state with current value when focused
                              if (countInputs[index] === undefined) {
                                setCountInputs(prev => ({ ...prev, [index]: part.count.toString() }));
                              }
                            }}
                            placeholder="Count"
                            className="w-full px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40"
                          />
                        </div>
                      )}

                      {part.type === 'repeat' && (
                        <div className="flex gap-1 min-w-0">
                          <input
                            type="text"
                            value={part.char}
                            onChange={(e) => handleUpdatePart(index, { char: e.target.value })}
                            placeholder="Character(s)"
                            className="w-24 px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40 shrink-0"
                          />
                          <input
                            type="text"
                            value={countInputs[index] !== undefined ? countInputs[index] : part.count.toString()}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              // Update local state to allow empty string
                              setCountInputs(prev => ({ ...prev, [index]: inputValue }));

                              // Only update part if it's a valid positive integer
                              if (inputValue === '') {
                                return; // Allow empty temporarily
                              }
                              const num = parseInt(inputValue);
                              if (!isNaN(num) && num > 0) {
                                handleUpdatePart(index, { count: num });
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = e.target.value;
                              const num = parseInt(inputValue);
                              // Ensure at least 1 on blur if empty or invalid
                              if (isNaN(num) || num < 1) {
                                handleUpdatePart(index, { count: 1 });
                                setCountInputs(prev => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                              } else {
                                // Clear local state if valid
                                setCountInputs(prev => {
                                  const next = { ...prev };
                                  delete next[index];
                                  return next;
                                });
                              }
                            }}
                            onFocus={() => {
                              // Initialize local state with current value when focused
                              if (countInputs[index] === undefined) {
                                setCountInputs(prev => ({ ...prev, [index]: part.count.toString() }));
                              }
                            }}
                            placeholder="Count"
                            className="flex-1 min-w-0 px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40"
                          />
                        </div>
                      )}

                      {part.type === 'fill' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={part.char}
                            onChange={(e) => handleUpdatePart(index, { char: e.target.value })}
                            placeholder="Fill character(s)"
                            className="flex-1 px-2 py-1 rounded border border-white/20 bg-white/10 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-0 focus:border-white/40"
                          />
                          <span className="text-white/60 text-xs whitespace-nowrap">[fill to max]</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemovePart(index)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-full transition-colors text-sm font-semibold shrink-0 flex items-center justify-center min-w-[32px]"
                      title="Remove this part"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Section - Preview & Buttons */}
          <div className="w-[280px] flex flex-col gap-3 shrink-0">
            {/* Preview */}
            <div className="flex flex-col shrink-0">
              <div className="text-white/60 text-xs mb-2 shrink-0">Preview</div>
              <div className="p-2 rounded border border-white/20 bg-white/5 flex flex-col">
                <div className="text-white/60 text-xs mb-1 shrink-0">Pattern:</div>
                <div className="font-mono text-white text-xs mb-2 break-all shrink-0 flex flex-wrap gap-0.5 items-center bg-black/20 p-1.5 rounded min-h-[2rem]">
                  {parts.length === 0 ? (
                    <span className="text-white/30 italic">No rules defined</span>
                  ) : (
                    parts.map((p, i) => (
                      <span
                        key={i}
                        className={cn(
                          "px-1 rounded text-[10px] border",
                          p.type === 'static' && "bg-gray-500/20 border-gray-500/30 text-gray-300",
                          p.type === 'dep' && "bg-purple-500/20 border-purple-500/30 text-purple-300",
                          p.type === 'random' && p.randomType === 'number' && "bg-blue-500/20 border-blue-500/30 text-blue-300",
                          p.type === 'random' && p.randomType !== 'number' && "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
                          p.type === 'repeat' && "bg-orange-500/20 border-orange-500/30 text-orange-300",
                          p.type === 'fill' && "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
                        )}
                        title={p.type}
                      >
                        {p.type === 'static' ? p.value :
                          p.type === 'dep' ? `dep_${p.fieldName}` :
                            p.type === 'random' ? `${p.randomType === 'number' ? 'rn' : 'rc'}[${p.count}]` :
                              p.type === 'repeat' ? `${p.char}[${p.count}]` :
                                `fill`}
                      </span>
                    ))
                  )}
                  {isAuto && <span className="px-1 rounded text-[10px] border bg-cyan-500/20 border-cyan-500/30 text-cyan-300 ml-1">AUTO</span>}
                </div>
                <div className="text-white/60 text-xs mb-1 shrink-0">Result:</div>
                <div className="font-mono text-green-400 text-xs overflow-x-auto custom-scrollbar whitespace-nowrap shrink-0">
                  {preview}
                </div>
                {maxLength !== undefined && (
                  <div className="mt-1 text-xs text-white/50 shrink-0">
                    {preview.length} / {maxLength} chars
                  </div>
                )}
              </div>
            </div>

            {/* Add Buttons */}
            <div className="shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white/60 text-xs">Add Rule</div>
                <button
                  type="button"
                  onClick={() => setIsAuto((prev) => !prev)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                    isAuto
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                      : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                  )}
                  title="When enabled, this gen field will be auto-generated before save (AUTO: prefix)."
                >
                  AUTO
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleAddPart('static')}
                  className="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
                >
                  + Static
                </button>
                <button
                  onClick={() => handleAddPart('dep')}
                  className="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
                >
                  + Dep
                </button>
                <button
                  onClick={() => handleAddPart('random')}
                  className="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
                >
                  + Random
                </button>
                <button
                  onClick={() => handleAddPart('repeat')}
                  className="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
                >
                  + Repeat
                </button>
                <button
                  onClick={() => handleAddPart('fill')}
                  className="px-2.5 py-1 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
                >
                  + Fill
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 shrink-0">
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded bg-white/5 text-white hover:bg-white/10 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-3 py-1.5 rounded bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function parsePattern(pattern: string): PatternPart[] {
  if (!pattern) return [];

  const parts: PatternPart[] = [];
  const matches = pattern.match(/([^()]+|\([^)]+\))/g) || [];

  for (const match of matches) {
    if (match.startsWith('(') && match.endsWith(')')) {
      const content = match.slice(1, -1);

      // Check for fill
      const fillMatch = content.match(/^(.+)\[fill\]$/);
      if (fillMatch) {
        parts.push({ type: 'fill', char: fillMatch[1] });
        continue;
      }

      // Check for dependency
      const depMatch = content.match(/^dep_(.+?)(\[(.+)\])?$/);
      if (depMatch) {
        parts.push({
          type: 'dep',
          fieldName: depMatch[1],
          extraction: depMatch[3],
        });
        continue;
      }

      // Check for random
      const rnMatch = content.match(/^rn\[(\d+)\]$/);
      if (rnMatch) {
        parts.push({ type: 'random', randomType: 'number', count: parseInt(rnMatch[1]) });
        continue;
      }

      const rcMatch = content.match(/^rc\[(\d+)\]$/);
      if (rcMatch) {
        parts.push({ type: 'random', randomType: 'letter', case: 'mixed', count: parseInt(rcMatch[1]) });
        continue;
      }

      const ruMatch = content.match(/^ru\[(\d+)\]$/);
      if (ruMatch) {
        parts.push({ type: 'random', randomType: 'letter', case: 'uppercase', count: parseInt(ruMatch[1]) });
        continue;
      }

      const rlMatch = content.match(/^rl\[(\d+)\]$/);
      if (rlMatch) {
        parts.push({ type: 'random', randomType: 'letter', case: 'lowercase', count: parseInt(rlMatch[1]) });
        continue;
      }

      // Check for repeat
      const repeatMatch = content.match(/^(.+)\[(\d+)\]$/);
      if (repeatMatch) {
        parts.push({
          type: 'repeat',
          char: repeatMatch[1],
          count: parseInt(repeatMatch[2]),
        });
        continue;
      }

      // Fallback: treat as static (shouldn't happen in valid patterns)
      parts.push({ type: 'static', value: match });
    } else {
      // Static text
      parts.push({ type: 'static', value: match });
    }
  }

  return parts;
}

function buildPattern(parts: PatternPart[]): string {
  return parts.map(part => {
    switch (part.type) {
      case 'static':
        return part.value;
      case 'dep': {
        const extraction = part.extraction ? `[${part.extraction}]` : '';
        return `(dep_${part.fieldName}${extraction})`;
      }
      case 'random':
        // Convert randomType and case to kind
        if (part.randomType === 'number') {
          return `(rn[${part.count}])`;
        } else if (part.randomType === 'letter') {
          const kind = part.case === 'uppercase' ? 'ru' : part.case === 'lowercase' ? 'rl' : 'rc';
          return `(${kind}[${part.count}])`;
        } else {
          // both - generate numbers and letters
          // Split count: half numbers, half letters (or as close as possible)
          const numCount = Math.ceil(part.count / 2);
          const letterCount = part.count - numCount;
          const letterKind = part.case === 'uppercase' ? 'ru' : part.case === 'lowercase' ? 'rl' : 'rc';
          return `(rn[${numCount}])(${letterKind}[${letterCount}])`;
        }
      case 'repeat':
        return `(${part.char}[${part.count}])`;
      case 'fill':
        return `(${part.char}[fill])`;
    }
  }).join('');
}
