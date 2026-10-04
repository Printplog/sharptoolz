import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, Loader2, ShieldAlert } from "lucide-react";

import { BASE_URL } from "@/api/apiClient";
import SvgFormTranslator from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslator";
import { readableTextColor } from "@/lib/apiTheme";
import useToolStore from "@/store/formStore";
import type { EmbedSessionData, FormField } from "@/types";

function responseError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.wallet === "string") return data.wallet;
    if (data && typeof data === "object") return JSON.stringify(data);
  }
  return error instanceof Error ? error.message : "The hosted form could not be loaded.";
}

function currentParentOrigin() {
  if (!document.referrer) return "";
  try {
    return new URL(document.referrer).origin;
  } catch {
    return "";
  }
}

function isManagedField(field: FormField) {
  const type = (field.type || "").toLowerCase();
  return Boolean(
    field.dependsOn ||
    type === "status" ||
    field.generationMode === "auto" ||
    field.generationRule?.startsWith("AUTO:") ||
    field.isTrackingId ||
    ((type === "qrcode" || type === "barcode") && field.generationRule)
  );
}

export default function HostedEmbedPage() {
  const tokenRef = useRef("");
  const parentOriginRef = useRef("");
  const containerRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(0);
  const [session, setSession] = useState<EmbedSessionData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completedDocumentId, setCompletedDocumentId] = useState<string | null>(null);
  const resetForm = useToolStore((state) => state.resetForm);
  const setName = useToolStore((state) => state.setName);

  useEffect(() => {
    const token = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const parentOrigin = currentParentOrigin();
    tokenRef.current = token;
    parentOriginRef.current = parentOrigin;
    if (!token.startsWith("stz_embed_") || !parentOrigin) {
      setError("Open this form through the website that created the SharpToolz session.");
      setLoading(false);
      return;
    }

    // Keep the capability token in memory and out of visible browser history.
    // URL fragments are never sent in HTTP requests or referrer headers.
    window.history.replaceState(null, "", window.location.pathname);
    axios.get<EmbedSessionData>(`${BASE_URL}/v1/embed/session`, {
      headers: {
        Authorization: `Embed ${token}`,
        "X-Embed-Origin": parentOrigin,
      },
    })
      .then(({ data }) => {
        setSession(data);
        if (data.status === "completed" && data.document_id) {
          setCompletedDocumentId(data.document_id);
        }
      })
      .catch((requestError) => setError(responseError(requestError)))
      .finally(() => setLoading(false));

    return () => {
      resetForm();
      setName("");
    };
  }, [resetForm, setName]);

  useEffect(() => {
    const parentOrigin = parentOriginRef.current;
    const container = containerRef.current;
    if (!parentOrigin || !container) return;

    let frame = 0;
    const sendHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = Math.ceil(container.getBoundingClientRect().height);
        if (height === lastHeightRef.current) return;
        lastHeightRef.current = height;
        window.parent.postMessage(
          { type: "sharptoolz:resize", height },
          parentOrigin,
        );
      });
    };
    const observer = new ResizeObserver(sendHeight);
    observer.observe(container);
    sendHeight();
    if (!loading) window.parent.postMessage({ type: "sharptoolz:ready" }, parentOrigin);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [loading, session, error, completedDocumentId]);

  const submit = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { fields, name } = useToolStore.getState();
      const values: Record<string, string | number | boolean | null> = {};
      const barcodeImages: Record<string, string> = {};
      for (const field of fields) {
        const canSubmit = session.operation === "create" || Boolean(field.editable);
        if (canSubmit && !isManagedField(field)) values[field.id] = field.currentValue ?? "";
        if (canSubmit && field.type === "barcode" && field.barcodeImage) {
          barcodeImages[field.id] = field.barcodeImage;
        }
      }

      const { data } = await axios.post<{ document_id: string; status: string }>(
        `${BASE_URL}/v1/embed/finalize`,
        { values, barcode_images: barcodeImages, name },
        {
          headers: {
            Authorization: `Embed ${tokenRef.current}`,
            "X-Embed-Origin": parentOriginRef.current,
            "Content-Type": "application/json",
          },
        },
      );
      setCompletedDocumentId(data.document_id);
      window.parent.postMessage(
        { type: "sharptoolz:completed", documentId: data.document_id, sessionId: session.id },
        parentOriginRef.current,
      );
    } catch (requestError) {
      const message = responseError(requestError);
      setError(message);
      window.parent.postMessage(
        { type: "sharptoolz:error", message, sessionId: session.id },
        parentOriginRef.current,
      );
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting]);

  const theme = session?.theme;
  const onPrimary = theme ? readableTextColor(theme.primaryColor) : "#09090b";

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const properties = {
      "--stz-primary": theme.primaryColor,
      "--stz-on-primary": readableTextColor(theme.primaryColor),
      "--stz-bg": theme.backgroundColor,
      "--stz-text": theme.textColor,
      "--stz-input": theme.inputBackground,
      "--stz-border": theme.borderColor,
      "--stz-radius": theme.borderRadius,
      "--background": theme.backgroundColor,
      "--foreground": theme.textColor,
      "--card": theme.backgroundColor,
      "--card-foreground": theme.textColor,
      "--primary": theme.primaryColor,
      "--primary-foreground": readableTextColor(theme.primaryColor),
      "--muted": theme.inputBackground,
      "--muted-foreground": theme.textColor,
      "--border": theme.borderColor,
      "--input": theme.borderColor,
      "--ring": theme.primaryColor,
      "--radius": theme.borderRadius,
    };
    const previous = Object.fromEntries(
      Object.keys(properties).map((property) => [property, root.style.getPropertyValue(property)]),
    );
    Object.entries(properties).forEach(([property, value]) => root.style.setProperty(property, value));

    return () => {
      Object.entries(previous).forEach(([property, value]) => {
        if (value) root.style.setProperty(property, value);
        else root.style.removeProperty(property);
      });
    };
  }, [theme]);

  const style = theme ? {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: `${theme.fontFamily}, ui-sans-serif, system-ui, sans-serif`,
    "--stz-primary": theme.primaryColor,
    "--stz-on-primary": onPrimary,
    "--stz-bg": theme.backgroundColor,
    "--stz-text": theme.textColor,
    "--stz-input": theme.inputBackground,
    "--stz-border": theme.borderColor,
    "--stz-radius": theme.borderRadius,
    "--background": theme.backgroundColor,
    "--foreground": theme.textColor,
    "--card": theme.backgroundColor,
    "--card-foreground": theme.textColor,
    "--primary": theme.primaryColor,
    "--primary-foreground": onPrimary,
    "--muted": theme.inputBackground,
    "--muted-foreground": theme.textColor,
    "--border": theme.borderColor,
    "--input": theme.borderColor,
    "--ring": theme.primaryColor,
    "--radius": theme.borderRadius,
  } as React.CSSProperties : undefined;

  return (
    <div ref={containerRef} className="stz-hosted-shell p-4 sm:p-6" style={style}>
      <style>{`
        .stz-hosted-shell .stz-hosted-workspace .text-white,
        .stz-hosted-shell .stz-hosted-workspace [class*="text-white/"] {
          color: var(--stz-text) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace .text-gray-400,
        .stz-hosted-shell .stz-hosted-workspace .text-muted-foreground {
          color: color-mix(in srgb, var(--stz-text) 62%, transparent) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace label,
        .stz-hosted-shell .stz-hosted-workspace h2,
        .stz-hosted-shell .stz-hosted-workspace h3 {
          color: var(--stz-text) !important;
        }
        #root .stz-hosted-shell .stz-hosted-workspace input,
        #root .stz-hosted-shell .stz-hosted-workspace textarea,
        #root .stz-hosted-shell .stz-hosted-workspace [data-slot="input"],
        #root .stz-hosted-shell .stz-hosted-workspace [data-slot="textarea"],
        #root .stz-hosted-shell .stz-hosted-workspace [data-slot="select-trigger"],
        #root .stz-hosted-shell .stz-hosted-workspace [data-slot="checkbox"],
        #root .stz-hosted-shell .stz-hosted-workspace button[role="combobox"],
        #root .stz-hosted-shell .stz-hosted-workspace .stz-hosted-secondary-control {
          background: var(--stz-input) !important;
          border-color: var(--stz-border) !important;
          border-radius: var(--stz-radius) !important;
          color: var(--stz-text) !important;
        }
        #root .stz-hosted-shell .stz-hosted-workspace button[class*="bg-white/"]:not([role="tab"]):not([role="combobox"]):not(.stz-hosted-submit) {
          background: var(--stz-input) !important;
          border-color: var(--stz-border) !important;
          color: var(--stz-text) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace input::placeholder,
        .stz-hosted-shell .stz-hosted-workspace textarea::placeholder {
          color: color-mix(in srgb, var(--stz-text) 48%, transparent) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace [data-form-panel-user] > div {
          background: color-mix(in srgb, var(--stz-text) 4%, var(--stz-bg)) !important;
          border-color: var(--stz-border) !important;
          border-radius: var(--stz-radius) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace [data-slot="tabs-list"] {
          background: color-mix(in srgb, var(--stz-text) 8%, var(--stz-bg)) !important;
          border-radius: var(--stz-radius) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace [role="tab"] {
          color: var(--stz-text) !important;
          opacity: .58;
        }
        .stz-hosted-shell .stz-hosted-workspace [role="tab"][data-state="active"] {
          background: var(--stz-primary) !important;
          color: var(--stz-on-primary) !important;
          opacity: 1;
        }
        .stz-hosted-shell .stz-hosted-workspace .stz-hosted-preview-frame {
          background: var(--stz-input) !important;
          border-color: var(--stz-border) !important;
          border-radius: var(--stz-radius) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace .border-white\\/20,
        .stz-hosted-shell .stz-hosted-workspace .border-white\\/10 {
          border-color: var(--stz-border) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace .stz-hosted-submit {
          background: var(--stz-primary) !important;
          border-radius: var(--stz-radius) !important;
          color: var(--stz-on-primary) !important;
          border-color: color-mix(in srgb, var(--stz-on-primary) 24%, transparent) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace .stz-hosted-submit > div > div {
          border-color: color-mix(in srgb, var(--stz-on-primary) 35%, transparent) !important;
        }
        [data-slot="select-content"] {
          background: var(--stz-input) !important;
          border-color: var(--stz-border) !important;
          color: var(--stz-text) !important;
          border-radius: var(--stz-radius) !important;
        }
        [data-slot="select-item"] {
          color: var(--stz-text) !important;
        }
        .stz-hosted-shell [data-slot="select-trigger"] svg,
        [data-slot="select-content"] > [data-slot="select-scroll-up-button"] svg,
        [data-slot="select-content"] > [data-slot="select-scroll-down-button"] svg {
          color: color-mix(in srgb, var(--stz-text) 70%, transparent) !important;
          stroke: currentColor !important;
        }
        [data-slot="select-item"] svg {
          color: var(--stz-primary) !important;
          stroke: currentColor !important;
        }
        [data-slot="select-item"]:focus,
        [data-slot="select-item"]:hover {
          background: color-mix(in srgb, var(--stz-primary) 18%, var(--stz-input)) !important;
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        {loading && (
          <div className="flex min-h-72 items-center justify-center gap-3 opacity-60">
            <Loader2 className="animate-spin" /> Loading secure form…
          </div>
        )}

        {!loading && error && !session && (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <ShieldAlert className="h-10 w-10 text-red-400" />
            <p className="max-w-lg text-red-300">{error}</p>
          </div>
        )}

        {!loading && session && completedDocumentId && (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12" style={{ color: theme?.primaryColor }} />
            <h1 className="text-2xl font-bold">
              Document {session.operation === "edit" ? "updated" : "created"}
            </h1>
            <p className="opacity-60">The document was securely returned to the application.</p>
          </div>
        )}

        {!loading && session && !completedDocumentId && (
          <>
            <header className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b pb-5" style={{ borderColor: theme?.borderColor }}>
              <div>
                {theme?.showSharpToolzBranding ? (
                  <p className="text-xs font-bold" style={{ color: theme.primaryColor }}>
                    SharpToolz hosted translator
                  </p>
                ) : null}
                <h1 className={theme?.showSharpToolzBranding ? "mt-1 text-2xl font-black" : "text-2xl font-black"}>{session.template.name}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <Clock3 className="h-4 w-4" /> Expires {new Date(session.expires_at).toLocaleTimeString()}
              </div>
            </header>

            <div className="stz-hosted-workspace">
              <SvgFormTranslator
                hosted={{
                  session,
                  embedToken: tokenRef.current,
                  parentOrigin: parentOriginRef.current,
                  onSubmit: submit,
                  isSubmitting: submitting,
                  error,
                }}
              />
            </div>

            {theme?.showSharpToolzBranding && (
              <p className="mt-6 text-center text-xs opacity-35">Powered by SharpToolz</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
