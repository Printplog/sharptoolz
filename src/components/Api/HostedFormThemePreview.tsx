import { useState, type CSSProperties } from "react";
import { Clock3, RotateCcw, Upload } from "lucide-react";

import { DEFAULT_API_THEME } from "@/lib/apiTheme";
import type { ApiTheme } from "@/types";

type HostedFormThemePreviewProps = {
  theme?: ApiTheme;
  className?: string;
  compact?: boolean;
};

function PreviewField({ label, value, theme }: { label: string; value: string; theme: ApiTheme }) {
  return (
    <label className="block space-y-2 text-left">
      <span className="block text-[10px] font-medium opacity-75">{label}</span>
      <input
        value={value}
        readOnly
        tabIndex={-1}
        className="h-9 w-full border px-3 text-[11px] outline-none"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.borderColor,
          borderRadius: theme.borderRadius,
          color: theme.textColor,
        }}
      />
    </label>
  );
}

function DocumentPreview({ theme }: { theme: ApiTheme }) {
  return (
    <div
      className="flex min-h-64 items-center justify-center overflow-hidden border p-4"
      style={{
        backgroundColor: theme.inputBackground,
        borderColor: theme.borderColor,
        borderRadius: theme.borderRadius,
      }}
    >
      <div className="aspect-[1.58/1] w-full max-w-md rounded-sm bg-[#f2eee4] p-5 text-[#101820] shadow-2xl">
        <div className="flex items-start justify-between border-b border-black/15 pb-3">
          <div>
            <p className="text-[7px] font-black uppercase tracking-[0.24em] text-black/45">Boarding pass</p>
            <p className="mt-1 text-sm font-black">LOS → LHR</p>
          </div>
          <p className="text-[8px] font-bold">03A</p>
        </div>
        <div className="grid grid-cols-2 gap-5 pt-4 text-[8px]">
          <span><b className="block text-[6px] uppercase tracking-widest text-black/40">Passenger</b>Ada Okafor</span>
          <span><b className="block text-[6px] uppercase tracking-widest text-black/40">Reference</b>customer_42</span>
        </div>
      </div>
    </div>
  );
}

export default function HostedFormThemePreview({
  theme = DEFAULT_API_THEME,
  className = "",
  compact = false,
}: HostedFormThemePreviewProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const shellStyle = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    fontFamily: `${theme.fontFamily || "Inter"}, ui-sans-serif, system-ui, sans-serif`,
  } satisfies CSSProperties;

  return (
    <div
      data-hosted-form-theme-preview
      className={`overflow-hidden border shadow-[0_28px_80px_rgba(0,0,0,0.28)] ${className}`}
      style={shellStyle}
    >
      <div className={compact ? "p-4" : "p-4 sm:p-5"}>
        <header className="flex items-start justify-between gap-3 border-b pb-4" style={{ borderColor: theme.borderColor }}>
          <div className="min-w-0 text-left">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.primaryColor }}>
              SharpToolz hosted translator
            </p>
            <p className="mt-1 truncate text-base font-black">Boarding Pass1_Fixed</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[9px] opacity-60">
            <Clock3 className="size-3" /> Expires 3:42 PM
          </div>
        </header>

        <div role="tablist" aria-label="Hosted form preview" className="mt-4 grid grid-cols-2 gap-1 rounded-md bg-white/10 p-1 text-center text-[10px] font-medium">
          {(["editor", "preview"] as const).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-2 capitalize transition"
                style={selected ? {
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius,
                  color: "#09090b",
                } : { color: theme.textColor, opacity: 0.58 }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "editor" ? (
          <div
            className="mt-4 space-y-4 border p-4 sm:p-5"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.textColor} 5%, transparent)`,
              borderColor: theme.borderColor,
              borderRadius: theme.borderRadius,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">Form Fields</h3>
              <button type="button" tabIndex={-1} className="flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-medium" style={{ borderColor: theme.borderColor, borderRadius: theme.borderRadius }}>
                <RotateCcw className="size-3" /> Reset
              </button>
            </div>

            <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
              <PreviewField label="Passenger Name (max 27)" value="Ada Okafor" theme={theme} />
              <PreviewField label="Flight Number" value="ST 204" theme={theme} />
              {!compact ? <PreviewField label="Departure Location (max 27)" value="Lagos" theme={theme} /> : null}
              {!compact ? <PreviewField label="Arrival Location (max 27)" value="London" theme={theme} /> : null}
            </div>

            <div className="flex justify-end border-t pt-4" style={{ borderColor: theme.borderColor }}>
              <button type="button" className="flex min-h-10 w-full items-center justify-center gap-2 px-5 text-xs font-bold text-[#09090b] sm:w-auto" style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius }}>
                {theme.buttonText || "Create document"} <Upload className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4"><DocumentPreview theme={theme} /></div>
        )}

        {theme.showSharpToolzBranding ? <p className="mt-3 text-center text-[9px] opacity-35">Powered by SharpToolz</p> : null}
      </div>
    </div>
  );
}
