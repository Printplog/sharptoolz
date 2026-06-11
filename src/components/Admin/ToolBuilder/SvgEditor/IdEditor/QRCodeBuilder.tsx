import { useState, useMemo, useEffect } from "react";
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
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from 'qrcode.react';
import BarcodePreview from "@/components/ui/BarcodePreview";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface QRCodeBuilderProps {
  value: string;
  onChange: (value: string) => void;
  allElements?: SvgElement[];
  maxLength?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  currentFieldValues?: Record<string, string>;
  defaultTextContent?: string;
  barcodeSymbology?: string; // If set, render a barcode preview (this bcid) instead of a QR preview
}

type RandomType = 'number' | 'letter' | 'both';
type RandomCase = 'uppercase' | 'lowercase' | 'mixed';

type PatternPart =
  | { type: 'static'; value: string }
  | { type: 'dep'; fieldName: string; extraction?: string }
  | { type: 'random'; randomType: RandomType; case?: RandomCase; count: number }
  | { type: 'repeat'; char: string; count: number }
  | { type: 'fill'; char: string }
  | { type: 'date'; format: string }
  | { type: 'env'; varName: string };

interface QRCodeRow {
  id: string;
  label: string;
  parts: PatternPart[];
}

export default function QRCodeBuilder({
  value,
  onChange,
  allElements = [],
  open,
  onOpenChange,
  trigger,
  currentFieldValues = {},
  barcodeSymbology,
}: QRCodeBuilderProps) {
  const [isAuto, setIsAuto] = useState<boolean>(() => value?.startsWith("AUTO:") || false);
  const patternWithoutAuto = value?.startsWith("AUTO:") ? value.substring(5) : value;
  const [rows, setRows] = useState<QRCodeRow[]>(() => parseQRCodePattern(patternWithoutAuto || ""));
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
  const [sampleInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      const patternWithoutAuto = value?.startsWith("AUTO:") ? value.substring(5) : value;
      setRows(parseQRCodePattern(patternWithoutAuto || ""));
      setIsAuto(value?.startsWith("AUTO:") || false);
    }
  }, [value, open]);

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

  const preview = useMemo(() => {
    try {
      const previewFields: Record<string, string> = {};
      availableFields.forEach(field => {
        if (sampleInputs[field] !== undefined) {
          previewFields[field] = sampleInputs[field];
        } else if (currentFieldValues[field] !== undefined) {
          previewFields[field] = String(currentFieldValues[field]);
        } else {
          previewFields[field] = `Sample_${field}`;
        }
      });

      return rows.map(row => {
        const rowPattern = buildPattern(row.parts);
        const rowValue = generateValue(rowPattern, previewFields);
        return row.label ? `${row.label}: ${rowValue}` : rowValue;
      }).join('\n');
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Invalid pattern'}`;
    }
  }, [rows, availableFields, currentFieldValues, sampleInputs]);

  const handleAddRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substr(2, 9), label: "", parts: [] }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    const newRows = [...rows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newRows.length) {
      [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
      setRows(newRows);
    }
  };

  const handleUpdateRowLabel = (index: number, label: string) => {
    setRows(rows.map((r, i) => i === index ? { ...r, label } : r));
  };

  const handleAddPartToRow = (rowIndex: number, type: PatternPart['type']) => {
    const newPart: PatternPart =
      type === 'static' ? { type: 'static', value: '' }
        : type === 'dep' ? { type: 'dep', fieldName: '' }
          : type === 'random' ? { type: 'random', randomType: 'number', count: 1 }
            : type === 'repeat' ? { type: 'repeat', char: '', count: 1 }
              : type === 'fill' ? { type: 'fill', char: '' }
                : type === 'date' ? { type: 'date', format: 'YYYY-MM-DD' }
                  : { type: 'env', varName: 'YEAR' };

    setRows(rows.map((r, i) => i === rowIndex ? { ...r, parts: [...r.parts, newPart] } : r));
  };

  const handleUpdatePartInRow = (rowIndex: number, partIndex: number, updates: Partial<PatternPart>) => {
    setRows(rows.map((r, i) => i === rowIndex ? {
      ...r,
      parts: r.parts.map((p, j) => j === partIndex ? { ...p, ...updates } as PatternPart : p)
    } : r));
  };


  const handleApply = () => {
    const basePattern = rows.map(r => {
      const partsPattern = buildPattern(r.parts);
      return r.label ? `${r.label}: ${partsPattern}` : partsPattern;
    }).join('\\n');
    
    // Replace spaces with underscores for the SVG ID (DSL requirement)
    const encodedPattern = basePattern.replace(/ /g, '_');
    const finalPattern = isAuto ? `AUTO:${encodedPattern}` : encodedPattern;
    
    onChange(finalPattern);
    onOpenChange(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          "w-[700px] max-w-[90vw] h-[350px]",
          "bg-black/95 backdrop-blur-sm border-white/20 rounded-xl",
          "p-4 shadow-xl text-white flex flex-col",
          "z-[100]"
        )}
      >
        <div className="mb-0 flex flex-col gap-1 shrink-0 pb-2 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-white">
              {barcodeSymbology ? "Barcode Builder" : "QR Code Builder"}
            </div>
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
          <div className="text-[10px] text-white/40">
            {barcodeSymbology
              ? "Add rows — each becomes a new line in the barcode."
              : "Add labeled rows for structured QR content."}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0 pt-3">
          {/* Left Section - Rows */}
          <div className="flex-1 flex flex-col min-w-0 pr-3">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Data Rows</div>
              <button
                onClick={handleAddRow}
                className="text-[10px] text-primary hover:text-primary/80 font-bold uppercase tracking-tighter"
              >
                + Add Row
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {rows.length === 0 ? (
                <div className="text-white/40 text-sm text-center py-8 border border-dashed border-white/5 rounded-lg">
                  No rows yet.
                </div>
              ) : (
                rows.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    className={cn(
                      "flex flex-col gap-2 p-2 rounded-md border transition-colors",
                      editingRowIndex === rowIndex ? "bg-white/10 border-primary/40" : "bg-white/5 border-white/10"
                    )}
                    onClick={() => setEditingRowIndex(rowIndex)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => handleUpdateRowLabel(rowIndex, e.target.value)}
                        placeholder="Label"
                        className="w-20 bg-transparent border-none text-xs font-bold text-white/80 placeholder:text-white/20 focus:ring-0 outline-none focus:outline-none p-0"
                      />
                      <span className="text-white/20">:</span>
                      <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[1.5rem]">
                        {row.parts.map((part, partIndex) => (
                          <span
                            key={partIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRowIndex(rowIndex);
                              setEditingPartIndex(partIndex);
                            }}
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer",
                              editingRowIndex === rowIndex && editingPartIndex === partIndex ? "border-primary text-primary" : "border-white/10 text-white/60",
                              part.type === 'static' && "bg-gray-500/10",
                              part.type === 'dep' && "bg-purple-500/20",
                              part.type === 'random' && "bg-blue-500/20",
                              part.type === 'date' && "bg-cyan-500/20",
                              part.type === 'env' && "bg-pink-500/20"
                            )}
                          >
                            {part.type === 'static' ? part.value || '""' :
                             part.type === 'dep' ? `dep_${part.fieldName}` :
                             part.type === 'random' ? `rn[${part.count}]` :
                             part.type === 'date' ? 'date' : 'env'}
                          </span>
                        ))}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/40">
                              <Plus className="w-3 h-3" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-black/95 border-white/20 text-white z-[110]">
                            <DropdownMenuItem onClick={() => handleAddPartToRow(rowIndex, 'static')}>+ Static</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddPartToRow(rowIndex, 'dep')}>+ Dep</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddPartToRow(rowIndex, 'random')}>+ Random</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddPartToRow(rowIndex, 'date')}>+ Date</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleMoveRow(rowIndex, 'up'); }} className="text-white/20 hover:text-white"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleMoveRow(rowIndex, 'down'); }} className="text-white/20 hover:text-white"><ArrowDown className="w-3 h-3" /></button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveRow(rowIndex); }}
                        className="w-5 h-5 flex items-center justify-center rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Part Editor Inline */}
                    {editingRowIndex === rowIndex && editingPartIndex !== null && row.parts[editingPartIndex] && (
                      <div className="mt-1 pt-2 border-t border-white/5 flex gap-2 items-center">
                        <span className="text-[9px] uppercase font-black text-primary/60 shrink-0">Edit {row.parts[editingPartIndex].type}:</span>
                        {row.parts[editingPartIndex].type === 'static' && (
                          <input
                            autoFocus
                            type="text"
                            value={(row.parts[editingPartIndex] as any).value}
                            onChange={(e) => handleUpdatePartInRow(rowIndex, editingPartIndex, { value: e.target.value })}
                            className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs outline-none focus:border-primary/40"
                          />
                        )}
                        {row.parts[editingPartIndex].type === 'dep' && (
                          <div className="flex-1 flex gap-1">
                            <Select
                              value={(row.parts[editingPartIndex] as any).fieldName}
                              onValueChange={(val) => handleUpdatePartInRow(rowIndex, editingPartIndex, { fieldName: val })}
                            >
                              <SelectTrigger className="flex-1 h-7 text-[10px] bg-white/5 border-white/10">
                                <SelectValue placeholder="Field" />
                              </SelectTrigger>
                              <SelectContent className="bg-black/95 border-white/20 text-white z-[120]">
                                {availableFields.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {row.parts[editingPartIndex].type === 'random' && (
                          <input
                            type="number"
                            value={(row.parts[editingPartIndex] as any).count}
                            onChange={(e) => handleUpdatePartInRow(rowIndex, editingPartIndex, { count: parseInt(e.target.value) || 1 })}
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs outline-none"
                          />
                        )}
                        <button
                          onClick={() => { setEditingPartIndex(null); }}
                          className="text-[10px] text-white/40 hover:text-white"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Section - Preview */}
          <div className="w-[240px] flex flex-col gap-3 shrink-0 border-l border-white/10 pl-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40 shrink-0">Preview</div>
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center gap-3 overflow-hidden">
                <div className="shrink-0 p-1">
                  {barcodeSymbology ? (
                    <div className="bg-white p-1.5 rounded-md">
                      <BarcodePreview value={preview} symbology={barcodeSymbology} maxHeight={80} maxWidth={180} />
                    </div>
                  ) : (
                    <QRCodeSVG
                      value={preview || " "}
                      size={100}
                      level="M"
                      bgColor="transparent"
                      fgColor="white"
                    />
                  )}
                </div>
                <div className="w-full min-h-0 flex flex-col gap-1">
                  <div className="text-[9px] uppercase font-black text-white/20">Data</div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <pre className="text-[10px] text-emerald-400/80 font-mono whitespace-pre-wrap break-all leading-tight">
                      {preview || "No content"}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 shrink-0">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="px-4 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Reuse buildPattern from GenRuleBuilder
function buildPattern(parts: PatternPart[]): string {
  return parts.map(part => {
    switch (part.type) {
      case 'static': return part.value;
      case 'dep': {
        const extraction = part.extraction ? `[${part.extraction}]` : '';
        return `(dep_${part.fieldName}${extraction})`;
      }
      case 'random': {
        if (part.randomType === 'number') return `(rn[${part.count}])`;
        const kind = part.case === 'uppercase' ? 'ru' : part.case === 'lowercase' ? 'rl' : 'rc';
        return `(${kind}[${part.count}])`;
      }
      case 'repeat': return `(${part.char}[${part.count}])`;
      case 'fill': return `(${part.char}[fill])`;
      case 'date': return `(date[${part.format}])`;
      case 'env': return `(env_${part.varName})`;
      default: return "";
    }
  }).join('');
}

// Specialized parser for labeled QR patterns: Label: (Rule)\nLabel: (Rule)
function parseQRCodePattern(pattern: string): QRCodeRow[] {
  if (!pattern) return [];

  // Decode underscores back to spaces for the UI, but ONLY outside of parentheses (dependencies)
  // We use a regex that matches either (...) or any other character.
  // We only replace _ in the 'any other character' parts.
  const decodedPattern = pattern.replace(/(\([^)]+\))|(_)/g, (_match, group1, _group2) => {
    if (group1) return group1; // Keep parentheses content as-is
    return ' '; // Replace underscore with space
  });
  
  const lines = decodedPattern.replace(/\\n/g, '\n').split('\n');
  
  return lines.filter(line => line.trim() !== '').map(line => {
    const colonIndex = line.indexOf(':');
    let label = "";
    let ruleContent = line;

    if (colonIndex !== -1) {
      label = line.substring(0, colonIndex).trim();
      ruleContent = line.substring(colonIndex + 1).trim();
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      label,
      parts: parseParts(ruleContent)
    };
  });
}

// Similar to GenRuleBuilder's parsePattern but simpler
function parseParts(pattern: string): PatternPart[] {
  if (!pattern) return [];
  const parts: PatternPart[] = [];
  const matches = pattern.match(/([^()]+|\([^)]+\))/g) || [];

  for (const match of matches) {
    if (match.startsWith('(') && match.endsWith(')')) {
      const content = match.slice(1, -1);
      if (content.match(/^dep_(.+?)(\[(.+)\])?$/)) {
        const depMatch = content.match(/^dep_(.+?)(\[(.+)\])?$/)!;
        parts.push({ type: 'dep', fieldName: depMatch[1], extraction: depMatch[3] });
      } else if (content.match(/^rn\[(\d+)\]$/)) {
        parts.push({ type: 'random', randomType: 'number', count: parseInt(content.match(/^rn\[(\d+)\]$/)![1]) });
      } else if (content.match(/^r[clu]\[(\d+)\]$/)) {
        const m = content.match(/^r([clu])\[(\d+)\]$/)!;
        parts.push({ type: 'random', randomType: 'letter', case: m[1] === 'u' ? 'uppercase' : m[1] === 'l' ? 'lowercase' : 'mixed', count: parseInt(m[2]) });
      } else if (content.match(/^date\[(.+)\]$/)) {
        parts.push({ type: 'date', format: content.match(/^date\[(.+)\]$/)![1] });
      } else if (content.startsWith('env_')) {
        parts.push({ type: 'env', varName: content.replace('env_', '') });
      } else {
        parts.push({ type: 'static', value: match });
      }
    } else {
      parts.push({ type: 'static', value: match });
    }
  }
  return parts;
}
