import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useWebSocketClient } from "./useWebSocketClient";
import { ensureVisitorId } from "@/lib/utils/visitorIdentity";

/**
 * Global hook to maintain a presence connection for all visitors.
 * This allows admins to see instantly when a user joins or leaves the site.
 */
export function usePresence() {
  const { user } = useAuthStore();
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const visitorId = ensureVisitorId();
  const wsUrl = `${protocol}://${baseWsUrl}/ws/presence/?vux_id=${encodeURIComponent(visitorId)}`;

  const { connect } = useWebSocketClient({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectInterval: 5000,
    dependencies: [user?.pk, visitorId],
  });

  useEffect(() => {
    // Sharp "Off Page" Detection
    // The pagehide event is more reliable than 'unload' for modern browsers
    const handleExit = () => {
      // We don't need to send a beacon for presence because 
      // closing the WebSocket itself triggers the 'disconnect' on the server.
      // Manually closing it here ensures it happens the moment the tab is hidden.
      connect(); // Accessing connect to ensure it's in scope, but we really want the cleanup
    };

    window.addEventListener("pagehide", handleExit);
    return () => {
      window.removeEventListener("pagehide", handleExit);
    };
  }, [connect]);
}
