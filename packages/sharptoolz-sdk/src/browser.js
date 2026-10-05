const instances = new WeakMap();
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function resolveTarget(target) {
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!(element instanceof HTMLElement)) throw new Error("SharpToolz mount target was not found.");
  return element;
}

function validateEmbedUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("A valid SharpToolz embedUrl is required.");
  }
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  const trusted = url.hostname === "sharptoolz.com" || url.hostname.endsWith(".sharptoolz.com");
  const secure = url.protocol === "https:" || (local && url.protocol === "http:");
  const trustedPort = local || url.port === "" || url.port === "443";
  if (!secure || (!trusted && !local) || !trustedPort || url.pathname !== "/embed" || !/^#stz_embed_[A-Za-z0-9_-]{43}$/.test(url.hash)) {
    throw new Error("embedUrl is not a SharpToolz hosted-session URL.");
  }
  return url;
}

function createLoadingOverlay(loading) {
  const settings = loading && typeof loading === "object" ? loading : {};
  const overlay = document.createElement("div");
  overlay.dataset.sharptoolzLoader = "";
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    zIndex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "320px",
    boxSizing: "border-box",
    padding: "24px",
    background: settings.backgroundColor || "transparent",
    color: settings.textColor || "#6b7280",
    fontFamily: settings.fontFamily || "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  });

  if (settings.element instanceof HTMLElement) {
    overlay.append(settings.element);
    return { overlay, stopAnimation() {} };
  }

  const content = document.createElement("div");
  Object.assign(content.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    maxWidth: "100%",
    textAlign: "center",
  });

  if (settings.logoUrl) {
    const logo = document.createElement("img");
    logo.src = settings.logoUrl;
    logo.alt = settings.logoAlt || "";
    logo.referrerPolicy = "no-referrer";
    Object.assign(logo.style, {
      display: "block",
      width: settings.logoWidth || "48px",
      maxWidth: "100%",
      height: "auto",
      objectFit: "contain",
    });
    content.append(logo);
  }

  const spinner = document.createElementNS(SVG_NAMESPACE, "svg");
  spinner.setAttribute("viewBox", "0 0 24 24");
  spinner.setAttribute("width", "24");
  spinner.setAttribute("height", "24");
  spinner.setAttribute("aria-hidden", "true");
  spinner.style.display = "block";
  spinner.style.color = settings.accentColor || "currentColor";
  const track = document.createElementNS(SVG_NAMESPACE, "circle");
  track.setAttribute("cx", "12");
  track.setAttribute("cy", "12");
  track.setAttribute("r", "9");
  track.setAttribute("fill", "none");
  track.setAttribute("stroke", "currentColor");
  track.setAttribute("stroke-width", "2.5");
  track.setAttribute("opacity", "0.22");
  const progress = document.createElementNS(SVG_NAMESPACE, "path");
  progress.setAttribute("d", "M12 3a9 9 0 0 1 9 9");
  progress.setAttribute("fill", "none");
  progress.setAttribute("stroke", "currentColor");
  progress.setAttribute("stroke-width", "2.5");
  progress.setAttribute("stroke-linecap", "round");
  spinner.append(track, progress);
  content.append(spinner);

  const text = document.createElement("span");
  text.textContent = typeof settings.text === "string" ? settings.text : "Loading form…";
  Object.assign(text.style, {
    fontSize: settings.textSize || "14px",
    lineHeight: "1.5",
  });
  content.append(text);
  overlay.append(content);

  const reduceMotion = typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animation = !reduceMotion && typeof spinner.animate === "function"
    ? spinner.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 850, iterations: Infinity, easing: "linear" },
    )
    : null;

  return { overlay, stopAnimation: () => animation?.cancel() };
}

export function mountHostedForm(target, options = {}) {
  const container = resolveTarget(target);
  const embedUrl = validateEmbedUrl(options.embedUrl);
  instances.get(container)?.destroy();

  const iframe = document.createElement("iframe");
  iframe.title = options.title || "Document form";
  iframe.src = embedUrl.toString();
  iframe.referrerPolicy = "strict-origin";
  iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
  iframe.setAttribute("allow", "clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'");
  const showLoader = options.loading !== false;
  Object.assign(iframe.style, {
    display: "block",
    width: "100%",
    height: `${Math.max(320, Number(options.height) || 680)}px`,
    border: "0",
    background: "transparent",
    borderRadius: options.borderRadius || "0",
    visibility: showLoader ? "hidden" : "visible",
  });
  if (showLoader) {
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
  }

  const frame = document.createElement("div");
  frame.dataset.sharptoolzEmbed = "";
  Object.assign(frame.style, {
    position: "relative",
    display: "block",
    width: "100%",
  });
  frame.setAttribute("aria-busy", showLoader ? "true" : "false");
  const loadingState = showLoader ? createLoadingOverlay(options.loading) : null;
  if (loadingState) frame.append(loadingState.overlay);
  frame.append(iframe);

  function revealIframe() {
    if (!showLoader || !loadingState?.overlay.isConnected) return;
    loadingState.stopAnimation();
    loadingState.overlay.remove();
    frame.setAttribute("aria-busy", "false");
    iframe.style.visibility = "visible";
    iframe.removeAttribute("aria-hidden");
    iframe.removeAttribute("tabindex");
  }

  function handleMessage(event) {
    if (event.origin !== embedUrl.origin || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || typeof data.type !== "string") return;
    if (data.type === "sharptoolz:resize" && options.autoResize !== false) {
      iframe.style.height = `${Math.max(320, Math.min(12_000, Number(data.height) || 680))}px`;
    } else if (data.type === "sharptoolz:ready") {
      revealIframe();
      options.onReady?.();
    } else if (data.type === "sharptoolz:completed") {
      options.onComplete?.({ documentId: data.documentId, sessionId: data.sessionId });
    } else if (data.type === "sharptoolz:error") {
      options.onError?.({ message: data.message, sessionId: data.sessionId });
    }
  }

  window.addEventListener("message", handleMessage);
  container.replaceChildren(frame);
  const controller = Object.freeze({
    iframe,
    destroy() {
      window.removeEventListener("message", handleMessage);
      loadingState?.stopAnimation();
      if (frame.parentNode === container) container.removeChild(frame);
      instances.delete(container);
    },
  });
  instances.set(container, controller);
  return controller;
}
