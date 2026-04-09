import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Eye, EyeOff, ExternalLink, Sparkles, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useChatStore from "@/store/chatStore";
import { getTemplate, getTemplateSvgForAdmin } from "@/api/apiEndpoints";
import ToolCardGrid from "./ToolCardGrid";
import updateSvgFromFormData from "@/lib/utils/updateSvgFromFormData";
import { generateValue } from "@/lib/utils/fieldGenerator";
import type { FormField } from "@/types";

/**
 * LivePreviewPanel — sticky preview pane shown in the SharpGuy standalone chat.
 * Only renders when a template is actively loaded (activeInlineTemplateId is set).
 * Reactively re-renders the SVG whenever inlineEditorFields changes.
 */
const LivePreviewPanel = memo(function LivePreviewPanel() {
  const navigate = useNavigate();
  const activeInlineTemplateId = useChatStore((s) => s.activeInlineTemplateId);
  const inlineEditorFields = useChatStore((s) => s.inlineEditorFields);
  const svgCache = useChatStore((s) => s.svgCache);
  const cacheSvg = useChatStore((s) => s.cacheSvg);
  const activeInlineTemplateFields = useChatStore((s) => s.activeInlineTemplateFields);
  const setActiveTemplateFields = useChatStore((s) => s.setActiveTemplateFields);
  const suggestedTemplates = useChatStore((s) => s.suggestedTemplates);

  const [livePreview, setLivePreview] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pulseFlash, setPulseFlash] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [zoom, setZoom] = useState(1);
  const baseSvgDocRef = useRef<Document | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const templateId = activeInlineTemplateId;

  // Fetch template data if missing from cache
  useEffect(() => {
    if (!templateId) {
      baseSvgDocRef.current = null;
      setLivePreview("");
      return;
    }

    const cachedSvg = svgCache[templateId];
    if (cachedSvg && activeInlineTemplateFields.length > 0) {
      const parser = new DOMParser();
      baseSvgDocRef.current = parser.parseFromString(cachedSvg, "image/svg+xml");
      return;
    }

    // Need to fetch
    let cancelled = false;
    async function load() {
      if (!templateId) return;
      setFetching(true);
      try {
        const [tpl, svg] = await Promise.all([
          getTemplate(templateId),
          getTemplateSvgForAdmin(templateId),
        ]);
        if (cancelled) return;

        cacheSvg(templateId, svg);
        const parsedFields =
          tpl.form_fields?.map((f: any) => ({
            ...f,
            currentValue: f.currentValue ?? f.defaultValue ?? "",
          })) || [];
        setActiveTemplateFields(parsedFields);

        const parser = new DOMParser();
        baseSvgDocRef.current = parser.parseFromString(svg, "image/svg+xml");
      } catch (err) {
        console.error("[LivePreview] Failed to fetch data:", err);
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [templateId, svgCache, activeInlineTemplateFields.length, cacheSvg, setActiveTemplateFields]);

  const renderPreview = useCallback(() => {
    if (!baseSvgDocRef.current || !activeInlineTemplateFields.length) return;
    try {
      const workDoc = baseSvgDocRef.current.cloneNode(true) as Document;

      // Merge stored AI edits into field definitions
      const mergedFields: FormField[] = activeInlineTemplateFields.map((f: FormField) => {
        const aiValue = inlineEditorFields[f.id];
        const base = aiValue !== undefined ? { ...f, currentValue: aiValue } : f;
        if (base.generationRule?.startsWith("AUTO:")) {
          return { ...base, currentValue: generateValue(base.generationRule!) };
        }
        return base;
      });

      updateSvgFromFormData(workDoc, mergedFields);

      const svgEl = workDoc.documentElement;
      svgEl.removeAttribute("width");
      svgEl.removeAttribute("height");
      svgEl.setAttribute(
        "viewBox",
        svgEl.getAttribute("viewBox") ||
          `0 0 ${svgEl.clientWidth || 800} ${svgEl.clientHeight || 1100}`,
      );
      svgEl.style.height = "100%";
      svgEl.style.width = "auto";
      svgEl.style.maxHeight = "100%";
      svgEl.style.display = "block";

      const serialized = new XMLSerializer().serializeToString(workDoc);
      setLivePreview(serialized);

      // Flash the "Live" indicator
      setPulseFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setPulseFlash(false), 1200);
    } catch {
      // ignore
    }
  }, [activeInlineTemplateFields, inlineEditorFields]);

  // Re-render whenever AI updates fields
  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  // Render either the active template preview or the template explorer (recommendations)

  return (
    <div className="flex flex-col h-full min-h-0 bg-black/20 border-l border-white/8 animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={13} className="text-indigo-400" />
          <span className="text-[11px] font-semibold text-white/70 tracking-wide uppercase">
            Live Preview
          </span>
          {/* Live dot */}
          <span
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
              pulseFlash
                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                : "bg-white/5 text-white/30 border border-white/10"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full inline-block transition-all duration-300 ${
                pulseFlash ? "bg-emerald-400 animate-pulse" : "bg-white/20"
              }`}
            />
            Live
          </span>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-white/5 rounded-md px-1 mr-2 border border-white/5">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-1 text-white/40 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="px-1 text-[9px] font-bold text-white/30 hover:text-white transition-colors min-w-[35px]"
              title="Reset Zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-1 text-white/40 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
          </div>

          <button
            onClick={() => navigate(`/tools/${templateId}?tab=ai`)}
            className="p-1.5 rounded-md text-white/30 hover:text-indigo-400 hover:bg-white/5 transition-colors"
            title="Open in full editor"
          >
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => setIsCollapsed((c) => !c)}
            className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/5 transition-colors"
            title={isCollapsed ? "Expand preview" : "Collapse preview"}
          >
            {isCollapsed ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>

      {/* Preview body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 min-h-0">
          {!templateId ? (
            // No active template — show suggestions if available
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Sparkles size={14} className="text-indigo-400" />
                <h3 className="text-[12px] font-bold text-white/90 uppercase tracking-wider">
                  Recommended For You
                </h3>
              </div>
              {suggestedTemplates.length > 0 ? (
                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                  <ToolCardGrid cards={suggestedTemplates} />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/20 py-12">
                  <Sparkles size={28} className="opacity-30" />
                  <p className="text-[11px] text-center leading-relaxed max-w-[160px]">
                    Ask Sharp Guy to help you create a document to see previews here
                  </p>
                </div>
              )}
            </div>
          ) : fetching ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20">
              <Loader2 size={24} className="animate-spin text-indigo-400/50" />
              <p className="text-[10px] uppercase tracking-widest font-bold">
                Fetching Template...
              </p>
            </div>
          ) : livePreview ? (
            <div className="h-full w-full overflow-auto custom-scrollbar bg-zinc-950/20 flex p-8 md:p-12 lg:p-16">
              <div 
                className="m-auto transition-all duration-300 relative shrink-0"
                style={{ 
                  height: `${70 * zoom}vh`,
                  minHeight: `${400 * zoom}px`,
                  width: 'auto'
                }}
              >
                <div
                  className="h-full rounded-[2.5rem] bg-white shadow-black shadow-[0_40px_100px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: livePreview }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/20 py-12">
              <Sparkles size={28} className="opacity-30" />
              <p className="text-[11px] text-center leading-relaxed max-w-[160px]">
                Generating preview...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default LivePreviewPanel;
