import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useSvgLiveUpdate } from "../hooks/useSvgLiveUpdate";
import type { SvgElement } from "@/lib/utils/parseSvgElements";

interface SvgUploadProps {
  currentSvg: string | null;
  onSvgUpload: (file: File) => void;
  onSelectElement?: (id: string) => void;
  elements?: SvgElement[];
  activeElementId?: string | null;
  draftElement?: SvgElement | null;
}

export default function SvgUpload({ currentSvg, onSvgUpload, onSelectElement, elements = [], activeElementId, draftElement }: SvgUploadProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number, y: number, startPanX: number, startPanY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  // Use the live update hook to modify the DOM imperatively
  useSvgLiveUpdate(containerRef as React.RefObject<HTMLDivElement>, elements, activeElementId, draftElement);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentSvg) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true;
    }

    setPan({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    // If we dragged, don't select elements
    if (hasDraggedRef.current) return;

    if (!onSelectElement) return;

    // Find the closest parent with an internal ID
    const target = (e.target as HTMLElement).closest('[data-internal-id]');
    if (target) {
      const id = target.getAttribute('data-internal-id');
      if (id) {
        onSelectElement(id);
      }
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="template-svg" className="text-sm font-medium">
          Live Editor Preview
        </Label>
        <div className="flex items-center gap-3">
          {currentSvg && (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg mr-2">
              <ZoomOut className="w-3 h-3 text-white/40" />
              <Slider
                value={[zoom]}
                min={0.1}
                max={5}
                step={0.1}
                className="w-24"
                onValueChange={(vals) => setZoom(vals[0])}
              />
              <ZoomIn className="w-3 h-3 text-white/40" />
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6 hover:bg-white/10"
                onClick={resetView}
                title="Reset View"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            </div>
          )}
          {currentSvg && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] bg-white/5 border-white/10 hover:bg-white/10"
              onClick={() => document.getElementById('template-svg')?.click()}
            >
              Replace SVG
            </Button>
          )}
        </div>
      </div>

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
              resetView();
            }
          }}
        />

        <div
          className={`block w-full min-h-[400px] max-h-[600px] border border-white/10 rounded-xl overflow-hidden relative group shadow-2xl transition-all select-none ${!currentSvg ? "cursor-pointer hover:border-white/30" : ""
            }`}
          onClick={!currentSvg ? () => document.getElementById('template-svg')?.click() : undefined}
        >
          {/* Subtle Checkered Background for Transparency */}
          <div className="absolute inset-0 bg-[#0a0a0a] opacity-50" />
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3M3RxMAgsWvNfS4GCI0pDBCc4G9MMXm600MW4PyDjjUMTSEAn1Y81X7hm6IAAAAASUVORK5CYII=')] bg-repeat" />

          {currentSvg ? (
            <div
              className={`relative w-full h-full min-h-[400px] flex items-center justify-center overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onClick={handlePreviewClick}
              title="Click to select, drag to pan"
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  transformOrigin: 'center center',
                  willChange: 'transform'
                }}
                className="[&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:h-auto [&_svg]:w-auto pointer-events-none [&_svg]:pointer-events-auto"
                dangerouslySetInnerHTML={{ __html: currentSvg }}
                ref={containerRef}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-white/40 hover:text-white/60 transition-colors relative z-10">
              <div className="w-16 h-16 border-2 border-dashed border-current rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center px-4">
                <div className="text-lg font-medium">Upload SVG Template</div>
                <div className="text-sm opacity-60 mt-1">Enhance your workflow by uploading an SVG file</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-white/40 px-2">
        <div className="flex gap-3">
          <span>🎯 Hint: Click to select, Drag to pan</span>
          {currentSvg && <span>📏 {(currentSvg.length / 1024).toFixed(1)} KB</span>}
        </div>
        <span>Preview is debounced for performance</span>
      </div>
    </div>
  );
}

