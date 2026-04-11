import { Check, X, Sparkles, ArrowRight } from "lucide-react";
import type { FieldSuggestion } from "@/store/chatStore";

interface SuggestionCardProps {
  suggestion: FieldSuggestion;
  onApprove: () => void;
  onReject: () => void;
}

export default function SuggestionCard({
  suggestion,
  onApprove,
  onReject,
}: SuggestionCardProps) {
  const isPending = suggestion.status === "pending";
  const isApproved = suggestion.status === "approved";
  const isRejected = suggestion.status === "rejected";

  return (
    <div
      className={`
      w-full mt-3 animate-in fade-in slide-in-from-top-2 duration-300
      rounded-xl border px-3.5 py-3
      ${
        isApproved
          ? "border-emerald-500/30 bg-emerald-500/[0.02]"
          : "border-indigo-500/20 bg-indigo-500/[0.04]"
      }
      ${isRejected ? "opacity-60 grayscale border-white/10 bg-white/[0.01]" : ""}
    `}
    >
      {/* Rationale */}
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles
          size={13}
          className={isApproved ? "text-emerald-400" : "text-indigo-400"}
        />
        <p
          className={`text-[12px] font-medium ${
            isApproved ? "text-emerald-200" : "text-indigo-200"
          }`}
        >
          {isApproved
            ? "Changes Applied"
            : isRejected
              ? "Changes Declined"
              : suggestion.rationale}
        </p>
      </div>

      {/* Changes list */}
      <div className="space-y-2 mb-3">
        {suggestion.updates.map((upd, i) => (
          <div
            key={i}
            className="flex flex-col gap-1 bg-white/[0.03] border border-white/5 rounded-lg p-2"
          >
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
              {upd.id}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-white/80">
              <span className="line-through text-white/30 truncate max-w-[120px]">
                {upd.old_value || "(empty)"}
              </span>
              <ArrowRight size={10} className="shrink-0 text-white/20" />
              <span className="font-medium text-white truncate">
                {upd.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 hover:bg-indigo-500/30 transition-all text-[11px] font-semibold shadow-sm"
          >
            <Check size={12} />
            Approve
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/[0.04] text-white/50 border border-white/10 hover:bg-white/[0.08] transition-all text-[11px] font-medium"
          >
            <X size={12} />
            Decline
          </button>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/70 py-1">
          <Check size={11} />
          <span>Successfully updated {suggestion.updates.length} fields.</span>
        </div>
      )}
    </div>
  );
}
