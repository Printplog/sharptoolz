// src/hooks/useActivitySocket.ts
import { useCallback, useState } from "react";
import { useWebSocketClient } from "./useWebSocketClient";
import { useAuthStore } from "@/store/authStore";
import type { ActivityLog } from "@/types";
export type { ActivityLog } from "@/types";

type NewVisitMessage = {
  type: "new_visit";
  visitor: {
    id: number;
    user: number | null;
    username?: string | null;
    user__username?: string | null;
    ip_address: string | null;
    session_key: string | null;
    visitor_id: string | null;
    path: string;
    method: string;
    user_agent: string;
    referrer: string | null;
    status_code: number | null;
    source: string | null;
    medium: string | null;
    campaign: string | null;
    channel_group: string | null;
    source_label?: string | null;
    timestamp: string;
  };
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPresenceUpdate = (value: unknown): value is PresenceUpdate =>
  isObject(value) &&
  value.type === "presence_update" &&
  typeof value.presence_key === "string" &&
  (value.status === "online" || value.status === "offline");

const isOnlineListUpdate = (value: unknown): value is OnlineListUpdate =>
  isObject(value) &&
  value.type === "online_list" &&
  Array.isArray(value.sessions);

const isNewVisitMessage = (value: unknown): value is NewVisitMessage =>
  isObject(value) &&
  value.type === "new_visit" &&
  isObject(value.visitor) &&
  typeof value.visitor.id === "number";

export type PresenceUpdate = {
  type: "presence_update";
  status: "online" | "offline";
  presence_key: string;
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
    (message: unknown) => {
      if (isPresenceUpdate(message)) {
        setPresenceUpdate(message);
        return;
      }

      if (isOnlineListUpdate(message)) {
        setInitialOnlineList(message.sessions);
        return;
      }

      if (isNewVisitMessage(message)) {
        const visitor = message.visitor;

        const normalizedLog: ActivityLog = {
          id: visitor.id,
          user: visitor.user,
          username: visitor.username ?? visitor.user__username ?? null,
          ip_address: visitor.ip_address,
          session_key: visitor.session_key,
          visitor_id: visitor.visitor_id,
          path: visitor.path,
          method: visitor.method,
          user_agent: visitor.user_agent,
          referrer: visitor.referrer,
          status_code: visitor.status_code,
          source: visitor.source,
          medium: visitor.medium,
          campaign: visitor.campaign,
          channel_group: visitor.channel_group,
          source_label: visitor.source_label ?? null,
          timestamp: visitor.timestamp,
        };

        setLogs((prev) => [normalizedLog, ...prev.filter((entry) => entry.id !== normalizedLog.id)].slice(0, 50));
      }
    },
    []
  );

  const { sendMessage, connect } = useWebSocketClient<unknown>({
    url: wsUrl,
    onMessage: handleMessage,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    dependencies: [user?.pk], // Force reconnect on login/logout
  });

  return { logs, presenceUpdate, initialOnlineList, sendMessage, reconnect: connect };
}
