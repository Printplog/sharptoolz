import { useEffect, useRef } from "react";
import Pusher from "pusher-js";

import { authorizeOwnerSupportRealtime } from "@/api/apiEndpoints";
import type { SupportRealtimeConfig, SupportTypingEvent } from "@/types";

export type SupportUpdatePayload = {
  ticket_id?: string;
  updated_at?: string;
};

type SupportRealtimeOptions = {
  config?: SupportRealtimeConfig;
  channel?: string;
  onUpdate: (payload?: SupportUpdatePayload) => void;
  onIncomingMessage?: (payload?: SupportUpdatePayload) => void;
  onTyping?: (event: SupportTypingEvent) => void;
  onBankingUpdate?: () => void;
};

export function useSupportRealtime({
  config,
  channel,
  onUpdate,
  onIncomingMessage,
  onTyping,
  onBankingUpdate,
}: SupportRealtimeOptions) {
  const callbacksRef = useRef({ onUpdate, onIncomingMessage, onTyping, onBankingUpdate });

  useEffect(() => {
    callbacksRef.current = { onUpdate, onIncomingMessage, onTyping, onBankingUpdate };
  }, [onBankingUpdate, onIncomingMessage, onTyping, onUpdate]);

  useEffect(() => {
    if (!config?.enabled || !config.key || !config.cluster || !channel) return;

    const pusher = new Pusher(config.key, {
      cluster: config.cluster,
      forceTLS: true,
      channelAuthorization: {
        customHandler: async (params, callback) => {
          try {
            const auth = await authorizeOwnerSupportRealtime(params.socketId, params.channelName);
            callback(null, auth);
          } catch (error) {
            callback(error instanceof Error ? error : new Error("Realtime authorization failed."), null);
          }
        },
      },
    });
    const subscription = pusher.subscribe(channel);

    const handleIncomingMessage = (payload?: SupportUpdatePayload) => {
      callbacksRef.current.onIncomingMessage?.(payload);
      callbacksRef.current.onUpdate(payload);
    };
    const handleUpdate = (payload?: SupportUpdatePayload) => {
      callbacksRef.current.onUpdate(payload);
    };
    const handleTyping = (payload?: SupportTypingEvent) => {
      if (payload && typeof payload.ticket_id === "string") {
        callbacksRef.current.onTyping?.(payload);
      }
    };
    const handleBanking = () => {
      callbacksRef.current.onBankingUpdate?.();
    };

    subscription.bind("support.created", handleIncomingMessage);
    subscription.bind("support.customer_message", handleIncomingMessage);
    subscription.bind("support.updated", handleUpdate);
    subscription.bind("support.typing", handleTyping);
    subscription.bind("banking.transfer_requested", handleBanking);
    subscription.bind("banking.card_added", handleBanking);
    subscription.bind("banking.card_updated", handleBanking);

    return () => {
      subscription.unbind_all();
      pusher.unsubscribe(channel);
      pusher.disconnect();
    };
  }, [channel, config?.cluster, config?.enabled, config?.key]);
}
