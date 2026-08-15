const instances = new WeakMap();

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

export function mountHostedForm(target, options = {}) {
  const container = resolveTarget(target);
  const embedUrl = validateEmbedUrl(options.embedUrl);
  instances.get(container)?.destroy();

  const iframe = document.createElement("iframe");
  iframe.title = options.title || "SharpToolz document form";
  iframe.src = embedUrl.toString();
  iframe.referrerPolicy = "strict-origin";
  iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
  iframe.setAttribute("allow", "clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'");
  Object.assign(iframe.style, {
    display: "block",
    width: "100%",
    height: `${Math.max(320, Number(options.height) || 680)}px`,
    border: "0",
    background: "transparent",
    borderRadius: options.borderRadius || "0",
  });

  function handleMessage(event) {
    if (event.origin !== embedUrl.origin || event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || typeof data !== "object" || typeof data.type !== "string") return;
    if (data.type === "sharptoolz:resize" && options.autoResize !== false) {
      iframe.style.height = `${Math.max(320, Math.min(12_000, Number(data.height) || 680))}px`;
    } else if (data.type === "sharptoolz:ready") {
      options.onReady?.();
    } else if (data.type === "sharptoolz:completed") {
      options.onComplete?.({ documentId: data.documentId, sessionId: data.sessionId });
    } else if (data.type === "sharptoolz:error") {
      options.onError?.({ message: data.message, sessionId: data.sessionId });
    }
  }

  window.addEventListener("message", handleMessage);
  container.replaceChildren(iframe);
  const controller = Object.freeze({
    iframe,
    destroy() {
      window.removeEventListener("message", handleMessage);
      if (iframe.parentNode === container) container.removeChild(iframe);
      instances.delete(container);
    },
  });
  instances.set(container, controller);
  return controller;
}
