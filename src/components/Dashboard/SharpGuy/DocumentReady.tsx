import { Download, Check } from "lucide-react";
import type { DocumentFile } from "@/store/chatStore";

interface DocumentReadyProps {
  file: DocumentFile;
}

export default function DocumentReady({ file }: DocumentReadyProps) {
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = file.data;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isPdf = file.mime === "application/pdf";

  return (
    <div className="w-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-3.5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Check size={18} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-white truncate">
            {file.filename}
          </p>
          <p className="text-[10px] text-white/40">
            {isPdf ? "PDF Document" : "PNG Image"} • Ready to download
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-colors shrink-0"
        >
          <Download size={12} />
          Download
        </button>
      </div>
    </div>
  );
}
