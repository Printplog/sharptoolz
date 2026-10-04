import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Monitor, Palette, RotateCcw, Save, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { getApiAccessStatus, updateApiConfiguration } from "@/api/apiEndpoints";
import HostedFormThemePreview from "@/components/Api/HostedFormThemePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { API_THEME_COLORS, DEFAULT_API_THEME, type ApiThemeColorKey } from "@/lib/apiTheme";
import type { ApiTheme } from "@/types";

const LIGHT_THEME: ApiTheme = {
  ...DEFAULT_API_THEME,
  primaryColor: "#176b5b",
  backgroundColor: "#f7f8f3",
  textColor: "#17362f",
  inputBackground: "#ffffff",
  borderColor: "#cbd8d1",
  appearance: "light",
};

const RADIUS_PRESETS = [
  { label: "Square", value: 0 },
  { label: "Soft", value: 8 },
  { label: "Rounded", value: 16 },
  { label: "Pill", value: 32 },
];

function apiError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string; non_field_errors?: string[] } } }).response;
    return response?.data?.detail || response?.data?.non_field_errors?.[0] || fallback;
  }
  return fallback;
}

function ThemeColorField({ theme, colorKey, label, onChange }: {
  theme: ApiTheme;
  colorKey: ApiThemeColorKey;
  label: string;
  onChange: (value: string) => void;
}) {
  const value = theme[colorKey];
  const [draft, setDraft] = useState(value.toUpperCase());

  useEffect(() => setDraft(value.toUpperCase()), [value]);

  const commitDraft = () => {
    const normalized = draft.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
      onChange(normalized.toLowerCase());
    } else {
      setDraft(value.toUpperCase());
    }
  };

  return (
    <label className="space-y-2 text-xs text-white/55">
      <span>{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-2 focus-within:border-primary/35">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          aria-label={`${label} color`}
        />
        <input
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraft(nextValue);
            if (/^#[0-9a-fA-F]{6}$/.test(nextValue)) onChange(nextValue.toLowerCase());
          }}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft();
            }
          }}
          maxLength={7}
          className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-white/70 outline-none"
          aria-label={`${label} hex value`}
          spellCheck={false}
        />
      </span>
    </label>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-[1500px] animate-pulse space-y-5 pb-16">
      <div className="h-16 rounded-2xl bg-white/[0.03]" />
      <div className="grid gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
        <div className="h-[680px] rounded-2xl bg-white/[0.03]" />
        <div className="h-[680px] rounded-2xl bg-white/[0.03]" />
      </div>
    </div>
  );
}

export default function ApiAppearancePage() {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<ApiTheme>(DEFAULT_API_THEME);
  const [savedTheme, setSavedTheme] = useState<ApiTheme>(DEFAULT_API_THEME);
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["api-access"],
    queryFn: getApiAccessStatus,
  });

  useEffect(() => {
    if (!data) return;
    const nextTheme = { ...DEFAULT_API_THEME, ...data.configuration.theme };
    setTheme(nextTheme);
    setSavedTheme(nextTheme);
  }, [data]);

  const isDirty = useMemo(() => JSON.stringify(theme) !== JSON.stringify(savedTheme), [savedTheme, theme]);
  const radiusValue = Number.parseInt(theme.borderRadius, 10) || 0;

  const saveAppearance = useMutation({
    mutationFn: () => updateApiConfiguration({ theme }),
    onSuccess: (configuration) => {
      const nextTheme = { ...DEFAULT_API_THEME, ...configuration.theme };
      setTheme(nextTheme);
      setSavedTheme(nextTheme);
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      toast.success("Form appearance saved.");
    },
    onError: (error) => toast.error(apiError(error, "Could not save form appearance.")),
  });

  if (isLoading) return <LoadingState />;

  if (isError || !data || !data.entitlement || data.entitlement.status !== "active") {
    return (
      <div className="mx-auto max-w-3xl pb-16">
        <Button asChild variant="ghost" className="mb-5 text-white/55"><Link to="/settings/api"><ArrowLeft /> Back to API settings</Link></Button>
        <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-6">
          <h1 className="text-xl font-semibold text-white">Appearance editor unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-white/45">Activate API access before customizing the hosted form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0 text-white/60">
            <Link to="/settings/api" aria-label="Back to API settings"><ArrowLeft /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Form appearance</h1>
              {isDirty ? <span className="size-2 rounded-full bg-amber-300" aria-label="Unsaved changes" /> : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-white/45">Shape the customer-facing form and review the exact control styling before saving.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button type="button" variant="ghost" disabled={!isDirty || saveAppearance.isPending} onClick={() => setTheme(savedTheme)}>
            Discard
          </Button>
          <Button type="button" loading={saveAppearance.isPending} disabled={!isDirty || saveAppearance.isPending} onClick={() => saveAppearance.mutate()}>
            <Save /> Save appearance
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[370px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <section className="space-y-3 border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-white">Starting style</h2>
                <p className="mt-1 text-xs text-white/35">Choose a base, then make it yours.</p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-white/45" onClick={() => setTheme(DEFAULT_API_THEME)}>
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "dark", label: "SharpToolz", theme: DEFAULT_API_THEME, base: "#0f1620", accent: "#cee88c" },
                { id: "light", label: "Light", theme: LIGHT_THEME, base: "#f7f8f3", accent: "#176b5b" },
              ].map((preset) => {
                const selected = theme.appearance === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTheme(preset.theme)}
                    className={`rounded-xl border p-3 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${selected ? "border-primary/45 bg-primary/[0.06] text-white" : "border-white/10 text-white/45 hover:border-white/20"}`}
                  >
                    <span className="mb-2.5 flex h-6 items-center rounded-md px-1.5" style={{ backgroundColor: preset.base }}>
                      <span className="h-2.5 w-2/5 rounded-sm" style={{ backgroundColor: preset.accent }} />
                    </span>
                    <span className="flex items-center justify-between">{preset.label}{selected ? <Check className="size-3.5 text-primary" /> : null}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 border-b border-white/10 p-4 sm:p-5">
            <div>
              <h2 className="text-sm font-medium text-white">Colour</h2>
              <p className="mt-1 text-xs text-white/35">Applied to the complete hosted form.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {API_THEME_COLORS.map(({ key, label }) => (
                <ThemeColorField key={key} theme={theme} colorKey={key} label={label} onChange={(value) => setTheme((current) => ({ ...current, [key]: value }))} />
              ))}
            </div>
          </section>

          <section className="space-y-4 border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-medium text-white">Corner radius</h2>
                <p className="mt-1 text-xs text-white/35">Inputs, selects, panels, and buttons.</p>
              </div>
              <output htmlFor="theme-radius" className="font-mono text-sm text-primary">{radiusValue}px</output>
            </div>
            <input
              id="theme-radius"
              type="range"
              min="0"
              max="32"
              aria-label="Corner radius"
              value={radiusValue}
              onChange={(event) => setTheme((current) => ({ ...current, borderRadius: `${event.target.value}px` }))}
              className="w-full accent-primary"
            />
            <div className="grid grid-cols-4 gap-1.5">
              {RADIUS_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  aria-pressed={radiusValue === preset.value}
                  onClick={() => setTheme((current) => ({ ...current, borderRadius: `${preset.value}px` }))}
                  className={`border px-1 py-2 text-[10px] transition ${radiusValue === preset.value ? "border-primary/45 bg-primary/[0.07] text-primary" : "border-white/10 text-white/40 hover:text-white/65"}`}
                  style={{ borderRadius: `${Math.min(preset.value, 12)}px` }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4 p-4 sm:p-5">
            <div className="space-y-2">
              <Label htmlFor="theme-font">Font family</Label>
              <Input id="theme-font" value={theme.fontFamily} maxLength={80} onChange={(event) => setTheme((current) => ({ ...current, fontFamily: event.target.value }))} className="border-white/10 bg-white/5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme-button">Submit button text</Label>
              <Input id="theme-button" value={theme.buttonText} maxLength={80} onChange={(event) => setTheme((current) => ({ ...current, buttonText: event.target.value }))} className="border-white/10 bg-white/5" />
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div>
                <Label htmlFor="theme-branding">SharpToolz branding</Label>
                <p className="mt-1 text-xs leading-5 text-white/35">Show the hosted translator and powered-by labels.</p>
              </div>
              <Switch id="theme-branding" checked={theme.showSharpToolzBranding} onCheckedChange={(checked) => setTheme((current) => ({ ...current, showSharpToolzBranding: checked }))} />
            </div>
          </section>
        </aside>

        <section className="xl:sticky xl:top-24">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.06] text-primary"><Palette className="size-4" /></span>
              <div>
                <h2 className="text-sm font-medium text-white">Customer view</h2>
                <p className="mt-0.5 text-xs text-white/35">Every control below uses the current theme.</p>
              </div>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-white/[0.025] p-1" aria-label="Preview width">
              {([
                { id: "desktop", label: "Desktop", icon: Monitor },
                { id: "mobile", label: "Mobile", icon: Smartphone },
              ] as const).map((option) => {
                const Icon = option.icon;
                const selected = previewWidth === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPreviewWidth(option.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${selected ? "bg-white/10 text-white" : "text-white/40 hover:text-white/65"}`}
                  >
                    <Icon className="size-3.5" /> {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-[720px] overflow-auto rounded-2xl border border-white/10 bg-[#080b10] p-3 sm:p-6">
            <div className={`mx-auto transition-[max-width] duration-300 ${previewWidth === "mobile" ? "max-w-[430px]" : "max-w-[980px]"}`}>
              <HostedFormThemePreview theme={theme} className="w-full" previewWidth={previewWidth} />
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/35">Appearance applies to new hosted sessions. Document artwork keeps the colours defined by its template.</p>
        </section>
      </div>
    </div>
  );
}
