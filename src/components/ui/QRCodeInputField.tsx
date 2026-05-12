import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';

interface QRCodeInputFieldProps {
  value: string; // The raw text/URL to encode
  onChange: (value: string) => void;
  disabled?: boolean;
}

const QRCodeInputField: React.FC<QRCodeInputFieldProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-200">
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

        {/* Simple Text Input */}
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-1">
            QR Content
          </label>
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter URL or text for the QR code..."
            className="w-full min-h-[120px] bg-white/5 border border-white/10 text-white rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed custom-scrollbar resize-y"
          />
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
