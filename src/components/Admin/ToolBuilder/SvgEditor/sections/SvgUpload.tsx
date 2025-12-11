import { Label } from "@/components/ui/label";

interface SvgUploadProps {
  currentSvg: string | null;
  onSvgUpload: (file: File) => void;
}

export default function SvgUpload({ currentSvg, onSvgUpload }: SvgUploadProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="template-svg" className="text-sm font-medium">
        Upload / Replace SVG
      </Label>
      <div className="relative">
        <input
          id="template-svg"
          type="file"
          accept=".svg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onSvgUpload(file);
              e.target.value = "";
            }
          }}
        />
        <label
          htmlFor="template-svg"
          className="block w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors overflow-hidden"
        >
          {currentSvg ? (
            <div className="relative w-full h-full group">
              <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-center text-sm">
                  <div className="font-medium mb-1">Current SVG loaded</div>
                  <div className="text-xs opacity-80">Size: {(currentSvg.length / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-sm font-medium">Click to replace SVG</div>
                  <div className="text-xs opacity-80">Upload a new SVG file</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/60 hover:text-white/80 transition-colors">
              <div className="w-12 h-12 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">Click to upload SVG</div>
                <div className="text-xs opacity-80">Upload an SVG file for this template</div>
              </div>
            </div>
          )}
        </label>
      </div>
      <p className="text-xs text-white/50">
        Upload a new SVG file to replace the existing template. Existing form field definitions will auto-refresh.
      </p>
    </div>
  );
}

