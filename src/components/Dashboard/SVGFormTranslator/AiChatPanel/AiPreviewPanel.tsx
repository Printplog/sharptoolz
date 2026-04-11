import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";
import useToolStore from "@/store/formStore";

interface AiPreviewPanelProps {
  templateId?: string;
  purchasedTemplateId?: string;
  /** Increments whenever AI updates fields — triggers auto-expand + flash */
  updateCount: number;
}

export default function AiPreviewPanel({
  templateId,
  purchasedTemplateId,
  updateCount,
}: AiPreviewPanelProps) {
  const svgPreview = useToolStore((state) => state.svgPreview);
  const [collapsed, setCollapsed] = useState(false);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCount = useRef(0);

  // Auto-expand + flash whenever the AI updates fields
  useEffect(() => {
    if (updateCount > prevCount.current) {
      prevCount.current = updateCount;
      setCollapsed(false);
      setFlash(true);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlash(false), 1400);
    }
  }, [updateCount]);

  if (!svgPreview) return null;

  const targetPath = templateId
    ? `/tools/${templateId}?tab=preview`
    : purchasedTemplateId
      ? `/tools/${purchasedTemplateId}?tab=preview`
      : null;

  return (
    <div className="border-t border-white/8 bg-black/15 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-2">
          <Eye size={11} className="text-indigo-400" />
          <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest">
            Live Preview
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              flash ? "bg-emerald-400 scale-125" : "bg-white/20"
            }`}
          />
        </div>
        <div className="flex items-center gap-0.5">
          {targetPath && (
            <a
              href={targetPath}
              className="p-1 rounded text-white/25 hover:text-indigo-400 hover:bg-white/5 transition-colors"
              title="Open full preview tab"
            >
              <ExternalLink size={11} />
            </a>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded text-white/25 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? "Show preview" : "Hide preview"}
          >
            {collapsed ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>
        </div>
      </div>

      {/* SVG rendered from our own sanitized pipeline — safe to inject */}
      {!collapsed && (
        <div
          className={`px-2 pb-2 max-h-[200px] overflow-y-auto transition-all duration-300 ${
            flash ? "ring-1 ring-inset ring-emerald-500/20" : ""
          }`}
        >
          <div className="rounded-lg overflow-hidden bg-white shadow-md">
            {/* SVG is sanitized by sanitizeSvgGradients + addWatermarkToSvg before reaching here */}
            {/* eslint-disable-next-line react/no-danger */}
            <div
              className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:block [&>svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: svgPreview }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
