import { Label } from "@/components/ui/label";

interface SvgUploadProps {
  currentSvg: string | null;
  onSvgUpload: (file: File) => void;
}

export default function SvgUpload({ currentSvg, onSvgUpload }: SvgUploadProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="template-svg" className="text-sm font-medium">
        Live Preview & Upload
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
          className="block w-full min-h-[300px] border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors overflow-hidden bg-white/5 relative group"
        >
          {currentSvg ? (
            <>
              {/* Live SVG Preview */}
              <div 
                className="w-full h-full p-4 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-[500px] [&_svg]:h-auto [&_svg]:w-auto"
                dangerouslySetInnerHTML={{ __html: currentSvg }}
              />
              
              {/* Hover Overlay for Upload */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <div className="text-lg font-medium">Click to Replace SVG</div>
                <div className="text-sm opacity-80 mt-1">Updates will be reset (except metadata)</div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-white/60 hover:text-white/80 transition-colors">
              <div className="w-16 h-16 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">Upload SVG Template</div>
                <div className="text-sm opacity-80 mt-1">Click to browse your files</div>
              </div>
            </div>
          )}
        </label>
      </div>
      <div className="flex justify-between text-xs text-white/50 px-1">
        <span>Preview updates automatically as you edit elements below.</span>
        {currentSvg && <span>{(currentSvg.length / 1024).toFixed(1)} KB</span>}
      </div>
    </div>
  );
}

