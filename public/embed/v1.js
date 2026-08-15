(function (global) {
  "use strict";

  var VERSION = "1.0.0";
  var instances = new WeakMap();

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
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.height = String(Math.max(320, Number(settings.height) || 680)) + "px";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.borderRadius = settings.borderRadius || "0";

    function handleMessage(event) {
      if (event.origin !== embedUrl.origin || event.source !== iframe.contentWindow) return;
      var data = event.data;
      if (!data || typeof data !== "object" || typeof data.type !== "string") return;
      if (data.type === "sharptoolz:resize" && settings.autoResize !== false) {
        var height = Math.max(320, Math.min(12000, Number(data.height) || 680));
        iframe.style.height = height + "px";
      } else if (data.type === "sharptoolz:ready" && typeof settings.onReady === "function") {
        settings.onReady();
      } else if (data.type === "sharptoolz:completed" && typeof settings.onComplete === "function") {
        settings.onComplete({ documentId: data.documentId, sessionId: data.sessionId });
      } else if (data.type === "sharptoolz:error" && typeof settings.onError === "function") {
        settings.onError({ message: data.message, sessionId: data.sessionId });
      }
    }

    global.addEventListener("message", handleMessage);
    container.replaceChildren(iframe);

    var controller = Object.freeze({
      iframe: iframe,
      destroy: function () {
        global.removeEventListener("message", handleMessage);
        if (iframe.parentNode === container) container.removeChild(iframe);
        instances.delete(container);
      },
    });
    instances.set(container, controller);
    return controller;
  }

  global.SharpToolz = Object.freeze({ version: VERSION, mount: mount });
})(window);
