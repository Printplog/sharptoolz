// src/hooks/useActivitySocket.ts
import { useCallback, useState } from "react";
import { useWebSocketClient } from "./useWebSocketClient";

export type ActivityLog = {
  id: number;
  user: number | null;
  username: string | null;
  ip_address: string | null;
  session_key: string | null;
  path: string;
  method: string;
  user_agent: string;
  referrer: string;
  timestamp: string;
};

export function useActivitySocket() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const wsUrl = `${protocol}://${baseWsUrl}/ws/activity/`;

  const handleMessage = useCallback(
    (newLog: ActivityLog) => {
        setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
    },
    []
  );

  const { sendMessage, connect } = useWebSocketClient<ActivityLog>({
    url: wsUrl,
    onMessage: handleMessage,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  return { logs, sendMessage, reconnect: connect };
}
