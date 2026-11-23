import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Loader2,
  Monitor,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FernwayLaunchMenu } from "./FernwayLaunchMenu";
import { useFernwayAppBaseUrl, type FernwayFormState } from "./themes";

const PREVIEW_ROUTES = [
  { path: "/overview", label: "Overview" },
  { path: "/cards", label: "Cards" },
  { path: "/transactions", label: "Transactions" },
  { path: "/transfers", label: "Transfers" },
] as const;

type PreviewRoute = (typeof PREVIEW_ROUTES)[number]["path"];

function encodeBase64Url(obj: Record<string, unknown>): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

interface FernwayPreviewPanelProps {
  form: FernwayFormState;
  isCreated: boolean;
  isLive: boolean;
  subscriptionStatus?: "test" | "active" | "expired";
  authToken?: string;
  onCopyCredentials: () => void;
}

export function FernwayPreviewPanel({
  form,
  isCreated,
  isLive,
  subscriptionStatus = "test",
  authToken,
  onCopyCredentials,
}: FernwayPreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [route, setRoute] = useState<PreviewRoute>("/overview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [reloadNonce, setReloadNonce] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const baseUrl = useFernwayAppBaseUrl();

  const encodedPayload = useMemo(() => {
    const balanceDollars = Number.parseFloat(form.account_balance || "0");
    const limitDollars = Number.parseFloat(form.card_limit || "0");
    return encodeBase64Url({
      firstName: form.first_name.trim() || "Alexander",
      lastName: form.last_name.trim() || "Hamilton",
      email: form.email.trim() || "alexander@lindenwaybank.com",
      theme: "emerald-forest",
      balance: Number.isFinite(balanceDollars) ? Math.round(balanceDollars * 100) : 25000000,
      cardHolder:
        form.card_holder_name.trim() ||
        `${form.first_name || "Alexander"} ${form.last_name || "Hamilton"}`.trim(),
      cardNumber: form.card_number.trim() || "4532 9182 7364 8892",
      cardExpiry: form.card_expiry.trim() || "12/28",
      cardCvv: form.card_cvv.trim() || "721",
      cardPin: form.card_pin.trim() || "1234",
      cardLimit: Number.isFinite(limitDollars) ? Math.round(limitDollars * 100) : 5000000,
      cardFrozen: Boolean(form.card_is_frozen),
      isLive,
      isCreated,
      subscriptionStatus,
    });
  }, [form, isCreated, isLive, subscriptionStatus]);

  // Freeze initial payload per route/reload so typing doesn't hard-reload the iframe;
  // live form updates flow smoothly via postMessage below.
  const [initialPayload, setInitialPayload] = useState(encodedPayload);

  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams();
    params.set("preview", initialPayload);
    if (isCreated && authToken) {
      params.set("previewToken", authToken);
    }
    if (reloadNonce > 0) {
      params.set("_r", String(reloadNonce));
    }
    return `${baseUrl}${route}?${params.toString()}`;
  }, [baseUrl, route, initialPayload, isCreated, authToken, reloadNonce]);

  useEffect(() => {
    if (!isLoaded || !iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "FERNWAY_PREVIEW_UPDATE",
          payload: encodedPayload,
          token: isCreated && authToken ? authToken : null,
        },
        new URL(baseUrl).origin,
      );
    } catch {
      // Ignore cross-origin timing glitches during navigation
    }
  }, [encodedPayload, isCreated, authToken, baseUrl, isLoaded]);

  const handleRouteChange = (nextRoute: PreviewRoute) => {
    setInitialPayload(encodedPayload);
    setIsLoaded(false);
    setRoute(nextRoute);
  };

  const handleReload = () => {
    setInitialPayload(encodedPayload);
    setIsLoaded(false);
    setReloadNonce((n) => n + 1);
  };

  const loginUrl = `${baseUrl}/sign-in`;
  const openLoggedInUrl =
    isCreated && authToken
      ? `${baseUrl}/overview?token=${encodeURIComponent(authToken)}`
      : null;

  return (
    <div className="stz-hosted-preview-frame w-full p-2 sm:p-4 bg-white/10 border border-white/20 rounded-xl space-y-3">
      {/* Live Website Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {PREVIEW_ROUTES.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleRouteChange(item.path)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                route === item.path
                  ? "bg-primary text-black font-semibold"
                  : "bg-white/5 text-white/70 hover:bg-white/15 hover:text-white border border-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              aria-label="Desktop preview"
              title="Desktop view"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewport === "desktop"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Monitor className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              aria-label="Mobile preview"
              title="Mobile view"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                viewport === "mobile"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <Smartphone className="size-3.5" />
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReload}
            className="h-8 px-2.5 text-xs bg-white/5 border-white/15 text-white/80 hover:bg-white/15 hover:text-white"
            title="Reload live preview"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopyCredentials}
            className="h-8 px-2.5 text-xs bg-white/5 border-white/15 text-white/80 hover:bg-white/15 hover:text-white"
            title="Copy sign-in email & password"
          >
            <Copy className="size-3.5 mr-1.5" />
            Copy Login
          </Button>

          <FernwayLaunchMenu
            homeUrl={baseUrl}
            loginUrl={loginUrl}
            loggedInUrl={openLoggedInUrl}
            size="sm"
          />
        </div>
      </div>

      {/* Real Fernway Website Iframe */}
      <div className="flex justify-center">
        <div
          className={`relative overflow-hidden rounded-xl border border-white/15 bg-[#0c111a] shadow-2xl transition-all duration-300 ${
            viewport === "mobile" ? "w-[390px] max-w-full" : "w-full"
          }`}
          style={{ height: viewport === "mobile" ? "760px" : "740px" }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c111a]/90 text-white/70">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Loading live Lindenway preview...</span>
            </div>
          )}

          <iframe
            ref={iframeRef}
            key={`${route}-${reloadNonce}`}
            src={iframeSrc}
            title="Lindenway Online Banking Live Preview"
            onLoad={() => setIsLoaded(true)}
            className="w-full h-full border-0 bg-white"
            allow="clipboard-write"
          />
        </div>
      </div>
    </div>
  );
}
