import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from './input';
import { Button } from './button';
import { Plus, Trash2, QrCode } from 'lucide-react';

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

const QRCodeInputField: React.FC<QRCodeInputFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [rows, setRows] = useState<QRCodeRow[]>([]);

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setRows([{ id: Math.random().toString(36).substr(2, 9), label: '', value: '' }]);
      return;
    }

    // Try to parse rows. If it doesn't look like "Label: Value", treat it as one row with empty label.
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
  }, [value === '']); // Only reset if value becomes empty externally

  const updateParent = useCallback((currentRows: QRCodeRow[]) => {
    const serialized = currentRows
      .map((r) => {
        if (r.label && r.value) return `${r.label}: ${r.value}`;
        return r.value || r.label;
      })
      .filter(Boolean)
      .join('\n');
    onChange(serialized);
  }, [onChange]);

  const handleAddRow = () => {
    const newRows = [...rows, { id: Math.random().toString(36).substr(2, 9), label: '', value: '' }];
    setRows(newRows);
  };

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

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            disabled={disabled}
            className="w-full mt-2 bg-white/5 border-dashed border-white/20 text-white/60 hover:bg-white/10 hover:text-white"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Field
          </Button>
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
};

export default QRCodeInputField;
