import { useEffect } from "react";
import Pusher from "pusher-js";

import { authorizeOwnerSupportRealtime } from "@/api/apiEndpoints";
import type { SupportRealtimeConfig } from "@/types";

type SupportRealtimeOptions = {
  config?: SupportRealtimeConfig;
  channel?: string;
  onUpdate: () => void;
};

export function useSupportRealtime({ config, channel, onUpdate }: SupportRealtimeOptions) {
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
    subscription.bind("support.created", onUpdate);
    subscription.bind("support.updated", onUpdate);

    return () => {
      subscription.unbind_all();
      pusher.unsubscribe(channel);
      pusher.disconnect();
    };
  }, [channel, config?.cluster, config?.enabled, config?.key, onUpdate]);
}
