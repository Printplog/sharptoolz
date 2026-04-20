import { useWebSocketClient } from "./useWebSocketClient";

/**
 * Global hook to maintain a presence connection for all visitors.
 * This allows admins to see instantly when a user joins or leaves the site.
 */
export function usePresence() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const wsUrl = `${protocol}://${baseWsUrl}/ws/presence/`;

  // We only need to connect; no message handling required for standard users.
  useWebSocketClient({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectInterval: 5000,
  });
}
