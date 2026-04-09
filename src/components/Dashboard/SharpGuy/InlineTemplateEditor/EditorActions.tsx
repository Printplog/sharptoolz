import { CreditCard, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorActionsProps {
  price: string;
  purchased: boolean;
  purchasing: boolean;
  handlePurchase: () => void;
  handleDownload: (format: "pdf" | "png") => void;
}

export function EditorActions({
  price,
  purchased,
  purchasing,
  handlePurchase,
  handleDownload,
}: EditorActionsProps) {
  return (
    <div className="px-3 py-2.5 border-t border-white/5 bg-white/2 flex items-center gap-2 flex-wrap">
      {!purchased ? (
        <>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors",
              purchasing
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30",
            )}
          >
            <CreditCard size={12} />
            {purchasing ? "Purchasing..." : `Purchase — $${price}`}
          </button>
          <span className="text-[10px] text-white/30">
            Tell Sharp Guy to edit fields, or use Full Editor
          </span>
        </>
      ) : (
        <>
          <button
            onClick={() => handleDownload("pdf")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30 transition-colors"
          >
            <Download size={12} />
            Download PDF
          </button>
          <button
            onClick={() => handleDownload("png")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/30 hover:bg-purple-500/30 transition-colors"
          >
            <Download size={12} />
            Download PNG
          </button>
          <span className="text-[10px] text-emerald-400/60">
            ✓ Purchased — ready to download
          </span>
        </>
      )}
    </div>
  );
}
