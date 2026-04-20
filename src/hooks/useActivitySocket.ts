// src/hooks/useActivitySocket.ts
import { useCallback, useState } from "react";
import { useWebSocketClient } from "./useWebSocketClient";
import { useAuthStore } from "@/store/authStore";

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
  status_code: number | null;
  timestamp: string;
};

export type PresenceUpdate = {
  type: "presence_update";
  status: "online" | "offline";
  session_key: string;
  username: string | null;
  ip_address?: string;
};

export type OnlineListUpdate = {
    type: "online_list";
    sessions: string[];
}

export function useActivitySocket() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [presenceUpdate, setPresenceUpdate] = useState<PresenceUpdate | null>(null);
  const [initialOnlineList, setInitialOnlineList] = useState<string[]>([]);

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const wsUrl = `${protocol}://${baseWsUrl}/ws/activity/`;

  const handleMessage = useCallback(
    (message: any) => {
        if (message.type === "presence_update") {
            setPresenceUpdate(message);
        } else if (message.type === "online_list") {
            setInitialOnlineList(message.sessions);
        } else {
            setLogs((prev) => [message, ...prev].slice(0, 50)); 
        }
    },
    []
  );

  const { sendMessage, connect } = useWebSocketClient<any>({
    url: wsUrl,
    onMessage: handleMessage,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    dependencies: [user?.pk], // Force reconnect on login/logout
  });

  return { logs, presenceUpdate, initialOnlineList, sendMessage, reconnect: connect };
}
