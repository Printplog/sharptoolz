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
  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number; width: number; height: number; rotation?: number } | null>(null);

  // Update selection bounding box whenever selection or zoom/pan changes
  useEffect(() => {
    if (!activeElementId || !containerRef.current) {
      setSelectionRect(null);
      return;
    }

    const updateRect = () => {
      const selectedEl = containerRef.current?.querySelector(`[data-internal-id="${activeElementId}"]`);
      if (selectedEl) {
        const rect = selectedEl.getBoundingClientRect();
        const containerRect = containerRef.current!.parentElement!.getBoundingClientRect();

        setSelectionRect({
          top: rect.top - containerRect.top,
          left: rect.left - containerRect.left,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setSelectionRect(null);
      }
    };

    updateRect();
    const timer = setTimeout(updateRect, 50); // Small delay to catch live updates
    return () => clearTimeout(timer);
  }, [activeElementId, zoom, pan, elements, draftElement]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentSvg) return;
    // Only pan if we click the background or hold space (panning is standard with space or right click, but we'll use left click on background)
    const isBackground = (e.target as HTMLElement).classList.contains('canvas-bg');
    if (isBackground || e.button === 1) {
      setIsDragging(true);
      hasDraggedRef.current = false;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
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
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (!onSelectElement) return;

    const target = (e.target as HTMLElement).closest('[data-internal-id]');
    if (target) {
      const id = target.getAttribute('data-internal-id');
      if (id) {
        onSelectElement(id);
      }
    } else {
      // Clicked on background
      onSelectElement("");
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = 0.01;
      setZoom(prev => Math.min(Math.max(0.1, prev + delta * factor), 10));
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="h-full flex flex-col pointer-events-auto">
      <div className="flex items-center justify-between p-4 shrink-0 bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/90">Canvas</h3>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">
              {zoom.toFixed(1)}x Zoom • {currentSvg ? (currentSvg.length / 1024).toFixed(1) : 0} KB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentSvg && (
            <div className="flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-xl mr-2">
              <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="text-white/40 hover:text-white transition-colors">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono w-8 text-center text-white/60">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(10, z + 0.2))} className="text-white/40 hover:text-white transition-colors">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3 bg-white/10 mx-1" />
              <button onClick={resetView} className="text-white/40 hover:text-white transition-colors" title="Reset View">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {currentSvg && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 rounded-lg"
              onClick={() => document.getElementById('template-svg')?.click()}
            >
              Replace
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
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
          className={`absolute inset-0 canvas-bg transition-colors select-none bg-[#0a0a0a] ${!currentSvg ? "cursor-pointer hover:bg-[#0f0f0f]" : isDragging ? 'cursor-grabbing' : 'cursor-default'
            }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onClick={!currentSvg ? () => document.getElementById('template-svg')?.click() : handlePreviewClick}
        >
          {/* Professional Design Grid */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x % (20 * zoom)}px ${pan.y % (20 * zoom)}px`
            }}
          />

          {currentSvg ? (
            <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.1s cubic-bezier(0.2, 0, 0.2, 1)',
                  transformOrigin: 'center center',
                  willChange: 'transform'
                }}
                className="pointer-events-none relative"
                ref={containerRef}
              >
                {/* Visual SVG Content */}
                <div
                  className="[&_svg]:max-w-none [&_svg]:max-h-none [&_svg]:h-auto [&_svg]:w-auto pointer-events-auto"
                  dangerouslySetInnerHTML={{ __html: currentSvg }}
                />
              </div>

              {/* Selection Overlay (Independent of SVG transform to avoid double scaling jitter) */}
              {selectionRect && (
                <div
                  className="absolute pointer-events-none transition-all duration-75 border-2 border-primary z-[60] shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  style={{
                    top: selectionRect.top,
                    left: selectionRect.left,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                >
                  {/* Handle dots (Just visual for Phase 1) */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-primary rounded-full" />

                  {/* Label tag */}
                  <div className="absolute -top-6 left-0 bg-primary text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-lg">
                    {activeElementId}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/40 hover:text-white/60 transition-colors relative z-10 pointer-events-none">
              <div className="w-20 h-20 border-2 border-dashed border-current rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center px-4">
                <div className="text-xl font-black uppercase tracking-widest text-white/80">Drop your Canvas</div>
                <div className="text-xs font-bold opacity-60 mt-2 uppercase tracking-tighter">Click anywhere to upload an SVG Template</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-black/40 border-t border-white/5 py-2 px-6 shrink-0">
        <div className="flex gap-5 text-[9px] font-black uppercase tracking-widest text-white/30">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-primary rounded-full" />
            Click to Select
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-white/40 rounded-full" />
            Cmd + Scroll to Zoom
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-white/40 rounded-full" />
            Drag Canvas to Pan
          </span>
        </div>
        <div className="text-[9px] font-mono text-white/20">
          SharpToolz Engine v2.0
        </div>
      </div>
    </div>
  );
}

