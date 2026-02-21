import { useState, useRef, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { useSvgLiveUpdate } from "../hooks/useSvgLiveUpdate";
import type { SvgElement } from "@/lib/utils/parseSvgElements";
import { useSvgStore } from "@/store/useSvgStore";

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
  const moveStartRef = useRef<{ x: number, y: number, initialX: number, initialY: number } | null>(null);
  const hasDraggedRef = useRef(false);

  const [movingElementId, setMovingElementId] = useState<string | null>(null);
  const [localMove, setLocalMove] = useState<{ x: number, y: number } | null>(null);

  // Get update action from store
  const { updateElement } = useSvgStore();

  // Create a draft for the moving element to reflect changes in real-time
  const moveDraft = useMemo(() => {
    if (!movingElementId || !localMove) return null;
    const el = elements.find(el => el.internalId === movingElementId);
    if (!el) return null;
    return {
      ...el,
      attributes: {
        ...el.attributes,
        x: String(localMove.x),
        y: String(localMove.y)
      }
    };
  }, [movingElementId, localMove, elements]);

  // Use the live update hook to modify the DOM imperatively
  useSvgLiveUpdate(containerRef as React.RefObject<HTMLDivElement>, elements, activeElementId, moveDraft || draftElement);

  const [selectionRect, setSelectionRect] = useState<{ top: number; left: number; width: number; height: number; rotation?: number } | null>(null);

  // Auto-fit SVG on load
  useEffect(() => {
    if (currentSvg && containerRef.current) {
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        // Use a small timeout to ensure layout is calculated
        const timer = setTimeout(() => {
          const container = containerRef.current?.parentElement;
          if (!container) return;

          const containerWidth = container.clientWidth - 80; // Margin
          const containerHeight = container.clientHeight - 80;

          // Get raw viewBox info if available
          const viewBox = svgElement.viewBox.baseVal;
          const svgW = viewBox.width || svgElement.width.baseVal.value || 800;
          const svgH = viewBox.height || svgElement.height.baseVal.value || 600;

          const zoomX = containerWidth / svgW;
          const zoomY = containerHeight / svgH;
          const fitZoom = Math.min(zoomX, zoomY, 1.2); // Cap at 1.2x for clarity

          setZoom(fitZoom);
          setPan({ x: 0, y: 0 });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [currentSvg]);

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
  }, [activeElementId, zoom, pan, elements, draftElement, moveDraft]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentSvg) return;
    hasDraggedRef.current = false;

    // 1. Check if we're clicking an element
    const target = (e.target as HTMLElement).closest('[data-internal-id]');
    const targetId = target?.getAttribute('data-internal-id');

    if (targetId && !e.shiftKey) {
      // If clicking a new element, select it immediately
      if (targetId !== activeElementId && onSelectElement) {
        onSelectElement(targetId);
      }

      // Start movement logic
      const el = elements.find(el => el.internalId === targetId);
      if (el) {
        setMovingElementId(targetId);
        moveStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          initialX: parseFloat(el.attributes.x || '0'),
          initialY: parseFloat(el.attributes.y || '0')
        };
        return;
      }
    }

    // 2. Pan logic (only if background or middle click or shift+left click)
    const isBackground = !targetId;
    if (isBackground || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Handle element moving
    if (movingElementId && moveStartRef.current) {
      const dx = (e.clientX - moveStartRef.current.x) / zoom;
      const dy = (e.clientY - moveStartRef.current.y) / zoom;

      if (Math.abs(dx * zoom) > 2 || Math.abs(dy * zoom) > 2) {
        hasDraggedRef.current = true;
      }

      setLocalMove({
        x: moveStartRef.current.initialX + dx * 0.9,
        y: moveStartRef.current.initialY + dy * 0.9
      });
      return;
    }

    // 2. Handle canvas panning
    if (!isDragging || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasDraggedRef.current = true;
    }

    setPan({
      x: dragStartRef.current.startPanX + dx * 0.8,
      y: dragStartRef.current.startPanY + dy * 0.8
    });
  };

  const handleMouseUp = () => {
    if (movingElementId && localMove) {
      // Sync to store on release
      updateElement(movingElementId, {
        attributes: {
          ...localMove,
          x: String(localMove.x),
          y: String(localMove.y)
        }
      });
    }

    setIsDragging(false);
    setMovingElementId(null);
    setLocalMove(null);
    dragStartRef.current = null;
    moveStartRef.current = null;
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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Keyboard zoom support (+ intercepts browser zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((prev) => Math.min(prev + 0.05, 10)); // Smaller steps
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((prev) => Math.max(0.1, prev - 0.05));
        } else if (e.key === "0") {
          e.preventDefault();
          resetView();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = 0.0005; // Ultra-smooth zoom
      setZoom((prev) => Math.min(Math.max(0.1, prev + delta * factor), 10));
    } else {
      // Very smooth panning
      setPan((prev) => ({
        x: prev.x - e.deltaX * 0.4,
        y: prev.y - e.deltaY * 0.4,
      }));
    }
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

