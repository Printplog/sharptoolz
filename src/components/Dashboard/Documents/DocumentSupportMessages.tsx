import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Inbox, Landmark, PackageSearch, Plane } from "lucide-react";

import { getTrackingSupportMessages } from "@/api/apiEndpoints";
import { SupportConversation } from "@/components/Dashboard/Support/SupportConversation";
import { SupportSettingsDialog } from "@/components/Dashboard/Support/SupportSettingsDialog";
import { SupportTicketDetailsDialog } from "@/components/Dashboard/Support/SupportTicketDetailsDialog";
import { useSupportRealtime, type SupportUpdatePayload } from "@/hooks/useSupportRealtime";
import { useSupportTypingState } from "@/hooks/useSupportTyping";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

function SourceIcon({ source }: { source: TrackingSupportMessage["source"] }) {
  if (source === "fernway") return <Landmark className="size-4" />;
  return source === "parcel_finda"
    ? <PackageSearch className="size-4" />
    : <Plane className="size-4" />;
}

export default function DocumentSupportMessages({ documentId }: { documentId: string }) {
  const queryClient = useQueryClient();
  const { handleTypingEvent, clearTicketTyping, getCustomerTyping } = useSupportTypingState();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-messages", { documentId }],
    queryFn: () => getTrackingSupportMessages({ document_id: documentId }),
    refetchInterval: (query) => (query.state.data?.realtime?.enabled ? false : 8_000),
  });

  const refreshMessages = useCallback(
    (payload?: SupportUpdatePayload) => {
      if (payload?.ticket_id) clearTicketTyping(payload.ticket_id);
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
    [clearTicketTyping, queryClient],
  );

  useSupportRealtime({
    config: data?.realtime,
    channel: data?.channel,
    onUpdate: refreshMessages,
    onTyping: handleTypingEvent,
  });

  if (isLoading) {
    return (
      <div className="divide-y divide-white/10 border-y border-white/10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse bg-white/[0.025]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-red-300">
        Support messages could not be loaded.
      </div>
    );
  }

  const messages = data?.results ?? [];
  const realtimeEnabled = Boolean(data?.realtime?.enabled);

  if (!messages.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center text-center">
        <Inbox className="size-9 text-white/15" />
        <p className="mt-4 text-sm font-medium text-white/60">No support messages for this document</p>
        <p className="mt-2 max-w-md text-xs leading-5 text-white/30">
          Requests sent with this document&apos;s tracking ID will appear here.
        </p>
        <div className="mt-4">
          <SupportSettingsDialog compact initialProfile={data?.support_profile} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>
            {messages.length} conversation{messages.length === 1 ? "" : "s"}
          </span>
          {realtimeEnabled && (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
          )}
        </div>
        <SupportSettingsDialog compact initialProfile={data?.support_profile} />
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {messages.map((message) => {
          const customerTyping = getCustomerTyping(message.id);
          return (
            <article key={message.id} className="py-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                    <span className="flex items-center gap-1.5 text-white/60">
                      <SourceIcon source={message.source} />
                      {message.source_label}
                    </span>
                    <span>·</span>
                    <span className={cn("capitalize", message.status === "new" && "text-primary")}>{message.status}</span>
                    <span>·</span>
                    <span>{format(new Date(message.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                    {customerTyping.active && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
                          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                          {customerTyping.name} is typing...
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{message.subject}</h3>
                </div>
                <SupportTicketDetailsDialog ticket={message} />
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#0d131a]/70">
                <SupportConversation
                  ticket={message}
                  embedded
                  customerTyping={customerTyping}
                  realtimeEnabled={realtimeEnabled}
                  supportProfile={data?.support_profile}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
