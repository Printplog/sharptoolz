import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from './input';
import { Button } from './button';
import { Trash2, QrCode } from 'lucide-react';

interface QRCodeRow {
  id: string;
  label: string;
  value: string;
}

interface QRCodeInputFieldProps {
  value: string; // Newline-separated "Label: Value" or just raw text
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface QRCodeInputFieldRef {
  addRow: () => void;
}

const QRCodeInputField = forwardRef<QRCodeInputFieldRef, QRCodeInputFieldProps>(({
  value,
  onChange,
  disabled = false,
}, ref) => {
  const [rows, setRows] = useState<QRCodeRow[]>([]);
  const lastSyncedValue = useRef<string>(value);

  const updateParent = useCallback((currentRows: QRCodeRow[]) => {
    const serialized = currentRows
      .map((r) => {
        if (r.label && r.value) return `${r.label}: ${r.value}`;
        return r.value || r.label;
      })
      .filter(Boolean)
      .join('\n');
    
    lastSyncedValue.current = serialized;
    onChange(serialized);
  }, [onChange]);

  const handleAddRow = useCallback(() => {
    console.log('[QR-DEBUG] handleAddRow called in child component');
    const newId = Math.random().toString(36).substr(2, 9);
    setRows(prev => {
        const newRows = [...prev, { id: newId, label: '', value: '' }];
        // We don't call updateParent here because an empty row doesn't change the encoded string
        return newRows;
    });
  }, []);

  // Expose addRow to parent
  useImperativeHandle(ref, () => ({
    addRow: handleAddRow
  }), [handleAddRow]);

  // Sync rows when value changes externally (e.g. via Regenerate button)
  useEffect(() => {
    if (value === lastSyncedValue.current && rows.length > 0) return;
    
    if (!value) {
      setRows([{ id: Math.random().toString(36).substr(2, 9), label: '', value: '' }]);
      lastSyncedValue.current = '';
      return;
    }

    const lines = value.split('\n');
    const parsedRows = lines.map((line) => {
      const colonIndex = line.indexOf(': ');
      if (colonIndex !== -1) {
        return {
          id: Math.random().toString(36).substr(2, 9),
          label: line.substring(0, colonIndex).trim(),
          value: line.substring(colonIndex + 2).trim(),
        };
      }
      return {
        id: Math.random().toString(36).substr(2, 9),
        label: '',
        value: line.trim(),
      };
    }).filter(r => r.label || r.value);

    if (parsedRows.length === 0) {
      setRows([{ id: Math.random().toString(36).substr(2, 9), label: '', value: '' }]);
    } else {
      setRows(parsedRows);
    }
    lastSyncedValue.current = value;
  }, [value, rows.length]);

  const handleRemoveRow = (id: string) => {
    const newRows = rows.filter((r) => r.id !== id);
    setRows(newRows);
    updateParent(newRows);
  };

  const handleRowChange = (id: string, field: 'label' | 'value', newValue: string) => {
    const newRows = rows.map((r) => (r.id === id ? { ...r, [field]: newValue } : r));
    setRows(newRows);
    updateParent(newRows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* QR Preview */}
        <div className="bg-white p-3 rounded-xl shadow-xl border border-white/10 shrink-0 mx-auto sm:mx-0">
          {value ? (
            <QRCodeSVG
              value={value}
              size={120}
              level="M"
              includeMargin={false}
              className="rounded-sm"
            />
          ) : (
            <div className="w-[120px] h-[120px] bg-gray-100 rounded-sm flex items-center justify-center">
               <QrCode className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Rows Input */}
        <div className="flex-1 w-full space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex gap-2 items-end group animate-in fade-in slide-in-from-left-2 duration-200">
              <div className="flex-1 space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Label</label>
                <Input
                  value={row.label}
                  onChange={(e) => handleRowChange(row.id, 'label', e.target.value)}
                  placeholder="e.g. Name"
                  disabled={disabled}
                  className="bg-white/5 border-white/10 text-white h-9 focus:ring-primary/30"
                />
              </div>
              <div className="flex-[2] space-y-1">
                <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">Value</label>
                <Input
                  value={row.value}
                  onChange={(e) => handleRowChange(row.id, 'value', e.target.value)}
                  placeholder="Enter details"
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
        </div>
      </div>
      
      {value && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
           <p className="text-[10px] uppercase font-black tracking-widest text-primary/60 mb-1">Encoded Content:</p>
           <pre className="text-[11px] text-white/70 whitespace-pre-wrap font-mono leading-tight">
             {value}
           </pre>
        </div>
      )}
    </div>
  );
});

QRCodeInputField.displayName = "QRCodeInputField";

export default QRCodeInputField;
