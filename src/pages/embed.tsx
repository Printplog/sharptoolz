import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2, Clock3, Loader2, ShieldAlert } from "lucide-react";

import { BASE_URL } from "@/api/apiClient";
import SvgFormTranslator from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslator";
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

    const sendHeight = () => {
      window.parent.postMessage(
        { type: "sharptoolz:resize", height: Math.ceil(container.scrollHeight) },
        parentOrigin,
      );
    };
    const observer = new ResizeObserver(sendHeight);
    observer.observe(container);
    sendHeight();
    if (!loading) window.parent.postMessage({ type: "sharptoolz:ready" }, parentOrigin);
    return () => observer.disconnect();
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
  const style = theme ? {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    fontFamily: `${theme.fontFamily}, ui-sans-serif, system-ui, sans-serif`,
    "--stz-primary": theme.primaryColor,
    "--stz-text": theme.textColor,
    "--stz-input": theme.inputBackground,
    "--stz-border": theme.borderColor,
    "--stz-radius": theme.borderRadius,
  } as React.CSSProperties : undefined;

  return (
    <div ref={containerRef} className="stz-hosted-shell min-h-screen p-4 sm:p-6" style={style}>
      <style>{`
        @layer base {
        .stz-hosted-shell .stz-hosted-workspace .text-white { color: var(--stz-text) !important; }
        .stz-hosted-shell .stz-hosted-workspace .text-gray-400 { color: color-mix(in srgb, var(--stz-text) 58%, transparent) !important; }
        #root .stz-hosted-shell .stz-hosted-workspace input,
        #root .stz-hosted-shell .stz-hosted-workspace textarea,
        #root .stz-hosted-shell .stz-hosted-workspace button[role="combobox"] {
          background: var(--stz-input) !important;
          border-color: var(--stz-border) !important;
          border-radius: var(--stz-radius) !important;
          color: var(--stz-text) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace [data-form-panel-user] > div {
          border-color: var(--stz-border) !important;
          border-radius: var(--stz-radius) !important;
        }
        .stz-hosted-shell .stz-hosted-workspace [role="tab"] {
          color: var(--stz-text) !important;
          opacity: .58;
        }
        .stz-hosted-shell .stz-hosted-workspace [role="tab"][data-state="active"] {
          background: var(--stz-primary) !important;
          color: #09090b !important;
          opacity: 1;
        }
        .stz-hosted-shell .stz-hosted-workspace .stz-hosted-submit {
          background: var(--stz-primary) !important;
          border-radius: var(--stz-radius) !important;
          color: #09090b !important;
        }
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
                <p className="text-xs font-bold" style={{ color: theme?.primaryColor }}>
                  SharpToolz hosted translator
                </p>
                <h1 className="mt-1 text-2xl font-black">{session.template.name}</h1>
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
