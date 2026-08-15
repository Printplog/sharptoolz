const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Keep the dashboard and API on the same loopback site during development.
 * Browsers intentionally withhold SameSite cookies when localhost calls
 * 127.0.0.1 (or the reverse), even though both point at this computer.
 */
export function resolveApiBaseUrl(configuredUrl: string, browserUrl?: string): string {
  if (!browserUrl) return configuredUrl.replace(/\/$/, "");

  try {
    const apiUrl = new URL(configuredUrl);
    const pageUrl = new URL(browserUrl);
    if (LOOPBACK_HOSTS.has(apiUrl.hostname) && LOOPBACK_HOSTS.has(pageUrl.hostname)) {
      apiUrl.hostname = pageUrl.hostname;
    }
    return apiUrl.toString().replace(/\/$/, "");
  } catch {
    return configuredUrl.replace(/\/$/, "");
  }
}
