(() => {
  "use strict";

  // The hosted form is a deliberately isolated surface. It never loads account
  // login or marketing scripts, and its CSP can therefore remain script-src self.
  if (window.location.pathname === "/embed") return;

  const fontStyles = document.createElement("link");
  fontStyles.rel = "stylesheet";
  fontStyles.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap";
  document.head.appendChild(fontStyles);

  const googleIdentityScript = document.createElement("script");
  googleIdentityScript.src = "https://accounts.google.com/gsi/client";
  googleIdentityScript.async = true;
  document.head.appendChild(googleIdentityScript);

  const objectName = "ttq";
  window.TiktokAnalyticsObject = objectName;
  const pixel = window[objectName] = window[objectName] || [];
  pixel.methods = [
    "page", "track", "identify", "instances", "debug", "on", "off", "once",
    "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent",
    "revokeConsent", "grantConsent",
  ];
  pixel.setAndDefer = (target, method) => {
    target[method] = (...args) => target.push([method, ...args]);
  };
  for (const method of pixel.methods) pixel.setAndDefer(pixel, method);
  pixel.instance = (id) => {
    const instance = (pixel._i && pixel._i[id]) || [];
    for (const method of pixel.methods) pixel.setAndDefer(instance, method);
    return instance;
  };
  pixel.load = (id, options) => {
    const source = "https://analytics.tiktok.com/i18n/pixel/events.js";
    pixel._i = pixel._i || {};
    pixel._i[id] = [];
    pixel._i[id]._u = source;
    pixel._t = pixel._t || {};
    pixel._t[id] = Date.now();
    pixel._o = pixel._o || {};
    pixel._o[id] = options || {};
    const script = document.createElement("script");
    script.async = true;
    script.src = `${source}?sdkid=${encodeURIComponent(id)}&lib=${objectName}`;
    document.head.appendChild(script);
  };
  pixel.load("D8Q7NLJC77U8IPSBJ97G");
  pixel.page();
})();
