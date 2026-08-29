import { useAuthStore } from "@/store/authStore";
import { useWebSocketClient } from "./useWebSocketClient";
import { ensureVisitorId } from "@/lib/utils/visitorIdentity";
import { resolveWebSocketUrl } from "@/api/resolveApiBaseUrl";

/**
 * Global hook to maintain a presence connection for all visitors.
 * Admins see joins/leaves in real time via the server-side disconnect event.
 *
 * Tab close / navigation cleanup is handled by useWebSocketClient's effect
 * teardown — it closes the socket with code 1000 on unmount and the browser
 * also sends a TCP FIN when the page unloads. No pagehide listener needed.
 */
export function usePresence(enabled = true) {
  const { user } = useAuthStore();
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const visitorId = enabled ? ensureVisitorId() : "embed";
  const wsUrl = resolveWebSocketUrl(
    `${protocol}://${baseWsUrl}/ws/presence/?vux_id=${encodeURIComponent(visitorId)}`,
    window.location.href,
  );

  useWebSocketClient({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectInterval: 5000,
    dependencies: [user?.pk, visitorId],
    enabled,
  });
}
