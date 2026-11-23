import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, CheckCircle2, Inbox, MessageSquareText, RotateCcw, XCircle } from "lucide-react";

import {
  getTrackingSupportMessages,
  updateTrackingSupportMessageStatus,
} from "@/api/apiEndpoints";
import { SupportConversation } from "@/components/Dashboard/Support/SupportConversation";
import { Button } from "@/components/ui/button";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function StatusPill({ status }: { status: TrackingSupportMessage["status"] }) {
  if (status === "new") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
        New
      </span>
    );
  }
  if (status === "closed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/55">
        Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      Open
    </span>
  );
}

export function FernwaySupportMessages({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["support-messages", { fernwayProfileId: profileId }];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => getTrackingSupportMessages({ fernway_profile_id: profileId }),
  });

  const refreshMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["support-messages"] });
  }, [queryClient]);

  useSupportRealtime({
    config: data?.realtime,
    channel: data?.channel,
    onUpdate: refreshMessages,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrackingSupportMessage["status"] }) =>
      updateTrackingSupportMessageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
  });

  const messages = useMemo(() => data?.results ?? [], [data?.results]);
  const selected = useMemo(() => {
    if (selectedId) {
      return messages.find((item) => item.id === selectedId) ?? messages[0] ?? null;
    }
    return messages[0] ?? null;
  }, [messages, selectedId]);

  const selectThread = (ticket: TrackingSupportMessage) => {
    setSelectedId(ticket.id);
    setMobileOpen(true);
    if (ticket.status === "new") {
      statusMutation.mutate({ id: ticket.id, status: "read" });
    }
  };

  if (isLoading) {
    return (
      <div className="grid h-[580px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d131a]/80 lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="space-y-2 border-r border-white/10 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="hidden p-6 lg:block">
          <div className="h-10 w-56 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="mt-6 space-y-4">
            <div className="h-16 w-72 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="ml-auto h-16 w-80 animate-pulse rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-red-300">
        Support messages could not be loaded.
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0d131a]/80 px-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <Inbox className="size-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-white/85">No support conversations yet</p>
        <p className="mt-1.5 max-w-md text-xs leading-5 text-white/45">
          When someone opens the bottom-right Support widget inside Lindenway for this account, their live chat will appear here and in your Support Messages inbox.
        </p>
      </div>
    );
  }

  const realtimeEnabled = Boolean(data?.realtime?.enabled);

  return (
    <div className="grid h-[600px] overflow-hidden rounded-2xl border border-white/10 bg-[#0d131a]/90 lg:grid-cols-[290px_minmax(0,1fr)]">
      {/* Left Pane: Conversation List */}
      <aside
        className={cn(
          "flex min-h-0 flex-col border-b border-white/10 bg-white/[0.015] lg:border-r lg:border-b-0",
          mobileOpen ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Conversations</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
              {messages.length}
            </span>
          </div>
          {realtimeEnabled && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex-1 divide-y divide-white/[0.06] overflow-y-auto">
          {messages.map((ticket) => {
            const isSelected = selected?.id === ticket.id;
            const lastEntry = ticket.conversation[ticket.conversation.length - 1];
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => selectThread(ticket)}
                className={cn(
                  "flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04]",
                  isSelected && "border-l-2 border-l-emerald-400 bg-emerald-500/[0.08]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      ticket.status === "new" ? "font-semibold text-white" : "font-medium text-white/85",
                    )}
                  >
                    {ticket.subject}
                  </span>
                  <StatusPill status={ticket.status} />
                </div>

                {lastEntry && (
                  <p className="line-clamp-1 text-xs text-white/45">
                    {lastEntry.direction === "owner" ? "You: " : `${ticket.customer_name}: `}
                    {lastEntry.body}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 text-[11px] text-white/35">
                  <span className="truncate">{ticket.customer_name}</span>
                  <span className="shrink-0">
                    {formatDistanceToNow(new Date(ticket.updated_at || ticket.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Pane: Active Live Chat */}
      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-col",
          !mobileOpen ? "hidden lg:flex" : "flex",
        )}
      >
        {selected ? (
          <>
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Back to conversations"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                  {getInitials(selected.customer_name)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                      {selected.subject}
                    </h3>
                    <StatusPill status={selected.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {selected.customer_name} · Started{" "}
                    {format(new Date(selected.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>

              {selected.status === "closed" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: selected.id, status: "read" })}
                  className="h-8 shrink-0 gap-1.5 rounded-lg border-white/12 bg-white/[0.04] px-3 text-xs text-white/85 hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reopen</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ id: selected.id, status: "closed" })}
                  className="h-8 shrink-0 gap-1.5 rounded-lg border-white/12 bg-white/[0.04] px-3 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                >
                  {selected.status === "new" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Close ticket</span>
                  <span className="sm:hidden">Close</span>
                </Button>
              )}
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SupportConversation ticket={selected} embedded />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <MessageSquareText className="size-9 text-white/15" />
            <p className="mt-3 text-sm text-white/45">Select a conversation to view messages.</p>
          </div>
        )}
      </section>
    </div>
  );
}
