const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

function alignLoopbackHostname(configuredUrl: string, browserUrl?: string): string {
  if (!browserUrl) return configuredUrl;

  try {
    const targetUrl = new URL(configuredUrl);
    const pageUrl = new URL(browserUrl);
    if (LOOPBACK_HOSTS.has(targetUrl.hostname) && LOOPBACK_HOSTS.has(pageUrl.hostname)) {
      targetUrl.hostname = pageUrl.hostname;
    }
    return targetUrl.toString();
  } catch {
    return configuredUrl;
  }
}

/**
 * Keep the dashboard and API on the same loopback site during development.
 * Browsers intentionally withhold SameSite cookies when localhost calls
 * 127.0.0.1 (or the reverse), even though both point at this computer.
 */
export function resolveApiBaseUrl(configuredUrl: string, browserUrl?: string): string {
  return alignLoopbackHostname(configuredUrl, browserUrl).replace(/\/$/, "");
}

/**
 * WebSocket handshakes must use the same loopback hostname as the dashboard so
 * the browser attaches the HttpOnly SameSite authentication cookie.
 */
export function resolveWebSocketUrl(configuredUrl: string, browserUrl?: string): string {
  return alignLoopbackHostname(configuredUrl, browserUrl);
}
