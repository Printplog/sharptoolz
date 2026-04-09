import { ExternalLink, FileText } from "lucide-react";
import { BASE_URL } from "@/api/apiClient";

interface EditorHeaderProps {
  templateName: string;
  toolName: string;
  price: string;
  banner: string;
  onOpenFullEditor?: () => void;
}

export function EditorHeader({
  templateName,
  toolName,
  price,
  banner,
  onOpenFullEditor,
}: EditorHeaderProps) {
  return (
    <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
          {banner ? (
            <img
              src={banner.startsWith("http") ? banner : `${BASE_URL}${banner}`}
              alt={templateName}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileText size={14} className="text-white/30" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-white truncate">
            {templateName}
          </p>
          <p className="text-[10px] text-white/40">
            {toolName} • ${price}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenFullEditor}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 rounded-md hover:bg-indigo-500/20 transition-colors"
          title="Open in full editor"
        >
          <ExternalLink size={10} />
          Full Editor
        </button>
      </div>
    </div>
  );
}
