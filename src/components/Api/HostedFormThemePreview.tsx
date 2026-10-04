import { useState, type CSSProperties, type ReactNode } from "react";
import { ChevronDown, Clock3, ImagePlus, RotateCcw, Upload } from "lucide-react";

import { DEFAULT_API_THEME, readableTextColor } from "@/lib/apiTheme";
import type { ApiTheme } from "@/types";

type HostedFormThemePreviewProps = {
  theme?: ApiTheme;
  className?: string;
  compact?: boolean;
  previewWidth?: "desktop" | "mobile";
};

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-left">
      <span className="block text-[11px] font-medium opacity-70">{label}</span>
      {children}
    </label>
  );
}

function PreviewField({ label, value, theme }: { label: string; value: string; theme: ApiTheme }) {
  return (
    <FieldShell label={label}>
      <input
        value={value}
        readOnly
        tabIndex={-1}
        data-preview-control="input"
        className="h-10 w-full border px-3 text-xs outline-none"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.borderColor,
          borderRadius: theme.borderRadius,
          color: theme.textColor,
        }}
      />
    </FieldShell>
  );
}

function PreviewSelect({ theme }: { theme: ApiTheme }) {
  return (
    <FieldShell label="Travel class">
      <button
        type="button"
        tabIndex={-1}
        data-preview-control="select"
        className="flex h-10 w-full items-center justify-between border px-3 text-left text-xs"
        style={{
          backgroundColor: theme.inputBackground,
          borderColor: theme.borderColor,
          borderRadius: theme.borderRadius,
          color: theme.textColor,
        }}
      >
        Economy <ChevronDown className="size-3.5 opacity-55" />
      </button>
    </FieldShell>
  );
}

function DocumentPreview({ theme }: { theme: ApiTheme }) {
  return (
    <div
      className="flex min-h-[420px] items-center justify-center overflow-hidden border p-5 sm:p-8"
      style={{
        backgroundColor: theme.inputBackground,
        borderColor: theme.borderColor,
        borderRadius: theme.borderRadius,
      }}
    >
      <div className="aspect-[1.58/1] w-full max-w-xl rounded-sm bg-[#f2eee4] p-5 text-[#101820] shadow-2xl sm:p-8">
        <div className="flex items-start justify-between border-b border-black/15 pb-4">
          <div>
            <p className="text-[10px] font-semibold text-black/45">Boarding pass</p>
            <p className="mt-1 text-base font-black sm:text-xl">LOS → LHR</p>
          </div>
          <p className="text-[9px] font-bold sm:text-xs">03A</p>
        </div>
        <div className="grid grid-cols-2 gap-5 pt-5 text-[9px] sm:text-xs">
          <span><b className="block text-[9px] text-black/40 sm:text-[10px]">Passenger</b>Ada Okafor</span>
          <span><b className="block text-[9px] text-black/40 sm:text-[10px]">Reference</b>customer_42</span>
          <span><b className="block text-[9px] text-black/40 sm:text-[10px]">Flight</b>ST 204</span>
          <span><b className="block text-[9px] text-black/40 sm:text-[10px]">Date</b>18 Oct 2026</span>
        </div>
      </div>
    </div>
  );
}

export default function HostedFormThemePreview({
  theme = DEFAULT_API_THEME,
  className = "",
  compact = false,
  previewWidth = compact ? "mobile" : "desktop",
}: HostedFormThemePreviewProps) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const isMobile = previewWidth === "mobile";
  const shellStyle = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    fontFamily: `${theme.fontFamily || "Inter"}, ui-sans-serif, system-ui, sans-serif`,
    "--stz-preview-radius": theme.borderRadius,
  } as CSSProperties;

  const controlStyle = {
    backgroundColor: theme.inputBackground,
    borderColor: theme.borderColor,
    borderRadius: theme.borderRadius,
    color: theme.textColor,
  } satisfies CSSProperties;

  return (
    <div
      data-hosted-form-theme-preview
      className={`overflow-hidden border shadow-[0_28px_80px_rgba(0,0,0,0.28)] ${className}`}
      style={shellStyle}
    >
      <div className={isMobile ? "p-4" : "p-4 sm:p-7"}>
        <header className={`flex gap-3 border-b pb-5 ${isMobile ? "flex-col" : "items-start justify-between"}`} style={{ borderColor: theme.borderColor }}>
          <div className="min-w-0 text-left">
            {theme.showSharpToolzBranding ? (
              <p className="text-[11px] font-bold" style={{ color: theme.primaryColor }}>
                SharpToolz hosted translator
              </p>
            ) : null}
            <p className={`${theme.showSharpToolzBranding ? "mt-1 " : ""}truncate text-lg font-black`}>Boarding pass</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-[10px] opacity-55">
            <Clock3 className="size-3.5" /> Expires 3:42 PM
          </div>
        </header>

        <div
          role="tablist"
          aria-label="Hosted form preview"
          className="mt-5 grid grid-cols-2 gap-1 p-1 text-center text-[11px] font-medium"
          style={{
            backgroundColor: `color-mix(in srgb, ${theme.textColor} 8%, ${theme.backgroundColor})`,
            borderRadius: theme.borderRadius,
          }}
        >
          {(["editor", "preview"] as const).map((tab) => {
            const selected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-2.5 capitalize transition"
                style={selected ? {
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.borderRadius,
                  color: readableTextColor(theme.primaryColor),
                } : { color: theme.textColor, opacity: 0.58, borderRadius: theme.borderRadius }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "editor" ? (
          <div
            className="mt-5 space-y-5 border p-4 sm:p-6"
            style={{
              backgroundColor: `color-mix(in srgb, ${theme.textColor} 4%, ${theme.backgroundColor})`,
              borderColor: theme.borderColor,
              borderRadius: theme.borderRadius,
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-left">
                <h3 className="text-sm font-semibold">Document details</h3>
                <p className="mt-1 text-[10px] opacity-50">Complete the fields exactly as they should appear.</p>
              </div>
              <button type="button" tabIndex={-1} data-preview-control="secondary-button" className="flex items-center gap-1.5 border px-3 py-2 text-[10px] font-medium" style={controlStyle}>
                <RotateCcw className="size-3" /> Reset
              </button>
            </div>

            <div className={`grid gap-4 ${isMobile ? "" : "sm:grid-cols-2"}`}>
              <PreviewField label="Passenger name" value="Ada Okafor" theme={theme} />
              <PreviewField label="Flight number" value="ST 204" theme={theme} />
              <PreviewField label="Departure" value="Lagos" theme={theme} />
              <PreviewSelect theme={theme} />
              <FieldShell label="Special requests">
                <textarea
                  value="Window seat, if available"
                  readOnly
                  tabIndex={-1}
                  data-preview-control="textarea"
                  className="min-h-20 w-full resize-none border px-3 py-2.5 text-xs outline-none"
                  style={controlStyle}
                />
              </FieldShell>
              <FieldShell label="Passenger photo">
                <button
                  type="button"
                  tabIndex={-1}
                  data-preview-control="upload"
                  className="flex min-h-20 w-full items-center justify-center gap-2 border border-dashed px-3 text-xs"
                  style={controlStyle}
                >
                  <ImagePlus className="size-4 opacity-55" /> Choose image
                </button>
              </FieldShell>
            </div>

            <div className="flex justify-end border-t pt-5" style={{ borderColor: theme.borderColor }}>
              <button
                type="button"
                data-preview-control="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 px-6 text-xs font-bold sm:w-auto"
                style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius, color: readableTextColor(theme.primaryColor) }}
              >
                {theme.buttonText || "Create document"} <Upload className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5"><DocumentPreview theme={theme} /></div>
        )}

        {theme.showSharpToolzBranding ? <p className="mt-4 text-center text-[9px] opacity-35">Powered by SharpToolz</p> : null}
      </div>
    </div>
  );
}
