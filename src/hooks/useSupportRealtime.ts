import { useEffect } from "react";
import Pusher from "pusher-js";

import { authorizeOwnerSupportRealtime } from "@/api/apiEndpoints";
import type { SupportRealtimeConfig } from "@/types";

type SupportRealtimeOptions = {
  config?: SupportRealtimeConfig;
  channel?: string;
  onUpdate: () => void;
  onIncomingMessage?: () => void;
  onBankingUpdate?: () => void;
};

export function useSupportRealtime({
  config,
  channel,
  onUpdate,
  onIncomingMessage,
  onBankingUpdate,
}: SupportRealtimeOptions) {
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
    const handleIncomingMessage = () => {
      onIncomingMessage?.();
      onUpdate();
    };
    subscription.bind("support.created", handleIncomingMessage);
    subscription.bind("support.customer_message", handleIncomingMessage);
    subscription.bind("support.updated", onUpdate);
    if (onBankingUpdate) {
      subscription.bind("banking.transfer_requested", onBankingUpdate);
      subscription.bind("banking.card_added", onBankingUpdate);
      subscription.bind("banking.card_updated", onBankingUpdate);
    }

    return () => {
      subscription.unbind_all();
      pusher.unsubscribe(channel);
      pusher.disconnect();
    };
  }, [channel, config?.cluster, config?.enabled, config?.key, onBankingUpdate, onIncomingMessage, onUpdate]);
}
