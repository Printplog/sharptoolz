(function (global) {
  "use strict";

  var VERSION = "1.1.0";
  var instances = new WeakMap();
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  function resolveTarget(target) {
    var element = typeof target === "string" ? document.querySelector(target) : target;
    if (!(element instanceof HTMLElement)) {
      throw new Error("SharpToolz.mount target was not found.");
    }
    return element;
  }

  function validateEmbedUrl(rawUrl) {
    var url;
    try {
      url = new URL(rawUrl);
    } catch (_error) {
      throw new Error("A valid SharpToolz embedUrl is required.");
    }
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new Error("SharpToolz embeds require HTTPS.");
    }
    var trustedHost = url.hostname === "sharptoolz.com" || url.hostname.endsWith(".sharptoolz.com");
    var localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    var trustedPort = localHost || url.port === "" || url.port === "443";
    var validToken = /^#stz_embed_[A-Za-z0-9_-]{43}$/.test(url.hash);
    if ((!trustedHost && !localHost) || !trustedPort || url.pathname !== "/embed" || !validToken) {
      throw new Error("embedUrl is not a SharpToolz hosted-session URL.");
    }
    return url;
  }

  function createLoadingOverlay(loading) {
    var settings = loading && typeof loading === "object" ? loading : {};
    var overlay = document.createElement("div");
    overlay.setAttribute("data-sharptoolz-loader", "");
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
      return { overlay: overlay, stopAnimation: function () {} };
    }

    var content = document.createElement("div");
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
      var logo = document.createElement("img");
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

    var spinner = document.createElementNS(SVG_NAMESPACE, "svg");
    spinner.setAttribute("viewBox", "0 0 24 24");
    spinner.setAttribute("width", "24");
    spinner.setAttribute("height", "24");
    spinner.setAttribute("aria-hidden", "true");
    spinner.style.display = "block";
    spinner.style.color = settings.accentColor || "currentColor";
    var track = document.createElementNS(SVG_NAMESPACE, "circle");
    track.setAttribute("cx", "12");
    track.setAttribute("cy", "12");
    track.setAttribute("r", "9");
    track.setAttribute("fill", "none");
    track.setAttribute("stroke", "currentColor");
    track.setAttribute("stroke-width", "2.5");
    track.setAttribute("opacity", "0.22");
    var progress = document.createElementNS(SVG_NAMESPACE, "path");
    progress.setAttribute("d", "M12 3a9 9 0 0 1 9 9");
    progress.setAttribute("fill", "none");
    progress.setAttribute("stroke", "currentColor");
    progress.setAttribute("stroke-width", "2.5");
    progress.setAttribute("stroke-linecap", "round");
    spinner.append(track, progress);
    content.append(spinner);

    var text = document.createElement("span");
    text.textContent = typeof settings.text === "string" ? settings.text : "Loading form…";
    Object.assign(text.style, {
      fontSize: settings.textSize || "14px",
      lineHeight: "1.5",
    });
    content.append(text);
    overlay.append(content);

    var reduceMotion = typeof global.matchMedia === "function"
      && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var animation = !reduceMotion && typeof spinner.animate === "function"
      ? spinner.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
        { duration: 850, iterations: Infinity, easing: "linear" }
      )
      : null;

    return {
      overlay: overlay,
      stopAnimation: function () {
        if (animation) animation.cancel();
      },
    };
  }

  function mount(target, options) {
    var container = resolveTarget(target);
    var settings = options || {};
    var embedUrl = validateEmbedUrl(settings.embedUrl);

    var existing = instances.get(container);
    if (existing) existing.destroy();

    var iframe = document.createElement("iframe");
    iframe.title = settings.title || "SharpToolz document form";
    iframe.src = embedUrl.toString();
    iframe.referrerPolicy = "strict-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
    iframe.setAttribute("allow", "clipboard-write 'none'; camera 'none'; microphone 'none'; geolocation 'none'");
    var showLoader = settings.loading !== false;
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.height = String(Math.max(320, Number(settings.height) || 680)) + "px";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.borderRadius = settings.borderRadius || "0";
    iframe.style.visibility = showLoader ? "hidden" : "visible";
    if (showLoader) {
      iframe.setAttribute("aria-hidden", "true");
      iframe.tabIndex = -1;
    }

    var frame = document.createElement("div");
    frame.setAttribute("data-sharptoolz-embed", "");
    frame.style.position = "relative";
    frame.style.display = "block";
    frame.style.width = "100%";
    frame.setAttribute("aria-busy", showLoader ? "true" : "false");
    var loadingState = showLoader ? createLoadingOverlay(settings.loading) : null;
    if (loadingState) frame.append(loadingState.overlay);
    frame.append(iframe);

    function revealIframe() {
      if (!showLoader || !loadingState || !loadingState.overlay.isConnected) return;
      loadingState.stopAnimation();
      loadingState.overlay.remove();
      frame.setAttribute("aria-busy", "false");
      iframe.style.visibility = "visible";
      iframe.removeAttribute("aria-hidden");
      iframe.removeAttribute("tabindex");
    }

    function handleMessage(event) {
      if (event.origin !== embedUrl.origin || event.source !== iframe.contentWindow) return;
      var data = event.data;
      if (!data || typeof data !== "object" || typeof data.type !== "string") return;
      if (data.type === "sharptoolz:resize" && settings.autoResize !== false) {
        var height = Math.max(320, Math.min(12000, Number(data.height) || 680));
        iframe.style.height = height + "px";
      } else if (data.type === "sharptoolz:ready") {
        revealIframe();
        if (typeof settings.onReady === "function") settings.onReady();
      } else if (data.type === "sharptoolz:completed" && typeof settings.onComplete === "function") {
        settings.onComplete({ documentId: data.documentId, sessionId: data.sessionId });
      } else if (data.type === "sharptoolz:error" && typeof settings.onError === "function") {
        settings.onError({ message: data.message, sessionId: data.sessionId });
      }
    }

    global.addEventListener("message", handleMessage);
    container.replaceChildren(frame);

    var controller = Object.freeze({
      iframe: iframe,
      destroy: function () {
        global.removeEventListener("message", handleMessage);
        if (loadingState) loadingState.stopAnimation();
        if (frame.parentNode === container) container.removeChild(frame);
        instances.delete(container);
      },
    });
    instances.set(container, controller);
    return controller;
  }

  global.SharpToolz = Object.freeze({ version: VERSION, mount: mount });
})(window);
