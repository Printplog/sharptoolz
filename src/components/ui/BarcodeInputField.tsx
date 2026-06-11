import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Trash2, Barcode as BarcodeIcon } from "lucide-react";
import { generateBarcodeDataUrl } from "@/lib/utils/barcodeGenerator";
import { symbologyLabel, DEFAULT_SYMBOLOGY } from "@/lib/utils/barcodeSymbologies";

interface BarcodeRow {
  id: string;
  label: string;
  value: string;
}

interface BarcodeInputFieldProps {
  /** Source text — newline-separated "Label: Value" rows (multi-line, like QR). */
  value: string;
  symbology?: string;
  disabled?: boolean;
  /**
   * Commit the serialized source text and its freshly baked PNG together.
   * Parent writes `text` to currentValue and `dataUrl` to barcodeImage in one update.
   */
  onCommit: (text: string, dataUrl: string) => void;
}

export interface BarcodeInputFieldRef {
  addRow: () => void;
}

const newId = () => Math.random().toString(36).substr(2, 9);

function serializeRows(rows: BarcodeRow[]): string {
  return rows
    .map((r) => (r.label && r.value ? `${r.label}: ${r.value}` : r.value || r.label))
    .filter(Boolean)
    .join("\n");
}

const BarcodeInputField = forwardRef<BarcodeInputFieldRef, BarcodeInputFieldProps>(
  ({ value, symbology, disabled = false, onCommit }, ref) => {
    const bcid = symbology || DEFAULT_SYMBOLOGY;
    const [rows, setRows] = useState<BarcodeRow[]>([]);
    const [preview, setPreview] = useState<string>("");
    const [error, setError] = useState<string>("");
    const lastSyncedValue = useRef<string>(value);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Bake the serialized rows (debounced) and commit text + image together.
    const commit = useCallback(
      (currentRows: BarcodeRow[]) => {
        const serialized = serializeRows(currentRows);
        lastSyncedValue.current = serialized;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!serialized) {
          setPreview("");
          setError("");
          onCommit("", "");
          return;
        }
        debounceRef.current = setTimeout(async () => {
          const { dataUrl, error: encodeError } = await generateBarcodeDataUrl(serialized, bcid);
          if (dataUrl) {
            setPreview(dataUrl);
            setError("");
            onCommit(serialized, dataUrl);
          } else {
            setPreview("");
            setError(encodeError || "Could not encode this value");
            onCommit(serialized, "");
          }
        }, 300);
      },
      [bcid, onCommit]
    );

    const handleAddRow = useCallback(() => {
      setRows((prev) => [...prev, { id: newId(), label: "", value: "" }]);
    }, []);

    useImperativeHandle(ref, () => ({ addRow: handleAddRow }), [handleAddRow]);

    // Sync rows when the value changes externally (gen rule, dependency, reload).
    useEffect(() => {
      if (value === lastSyncedValue.current && rows.length > 0) return;
      if (!value) {
        setRows([{ id: newId(), label: "", value: "" }]);
        lastSyncedValue.current = "";
        return;
      }
      const parsed = value
        .split("\n")
        .map((line) => {
          const i = line.indexOf(": ");
          if (i !== -1) {
            return { id: newId(), label: line.slice(0, i).trim(), value: line.slice(i + 2).trim() };
          }
          return { id: newId(), label: "", value: line.trim() };
        })
        .filter((r) => r.label || r.value);
      setRows(parsed.length ? parsed : [{ id: newId(), label: "", value: "" }]);
      lastSyncedValue.current = value;
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-bake whenever the rows or symbology change.
    useEffect(() => {
      commit(rows);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }, [rows, bcid]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRowChange = (id: string, field: "label" | "value", v: string) => {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: v } : r)));
    };

    const handleRemoveRow = (id: string) => {
      setRows((rs) => rs.filter((r) => r.id !== id));
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Preview */}
          <div className="bg-white p-3 rounded-xl shadow-xl border border-white/10 shrink-0 mx-auto sm:mx-0 min-w-[140px] min-h-[120px] flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt={`${symbologyLabel(bcid)} barcode`}
                className="max-w-[220px] max-h-[140px] object-contain"
              />
            ) : (
              <div className="w-[120px] h-[100px] flex items-center justify-center text-gray-300">
                <BarcodeIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Rows */}
          <div className="flex-1 w-full space-y-3">
            <span className="inline-block text-[10px] uppercase font-black tracking-widest text-primary/70 bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
              {symbologyLabel(bcid)}
            </span>
            {rows.map((row) => (
              <div key={row.id} className="flex gap-2 items-end group animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Label</label>
                  <Input
                    value={row.label}
                    onChange={(e) => handleRowChange(row.id, "label", e.target.value)}
                    placeholder="e.g. Name"
                    disabled={disabled}
                    className="bg-white/5 border-white/10 text-white h-9 focus:ring-primary/30"
                  />
                </div>
                <div className="flex-[2] space-y-1">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Value</label>
                  <Input
                    value={row.value}
                    onChange={(e) => handleRowChange(row.id, "value", e.target.value)}
                    placeholder="Enter value"
                    disabled={disabled}
                    className="bg-white/5 border-white/10 text-white h-9 focus:ring-primary/30"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveRow(row.id)}
                  disabled={disabled || rows.length <= 1}
                  className="h-9 w-9 text-white/20 hover:text-red-400 hover:bg-red-400/10 mb-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {error && <p className="text-[11px] text-red-400/80 leading-tight">{error}</p>}
          </div>
        </div>
      </div>
    );
  }
);

BarcodeInputField.displayName = "BarcodeInputField";

export default BarcodeInputField;
