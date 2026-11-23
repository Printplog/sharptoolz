import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Clock, Headphones, Loader2, Lock, Send } from "lucide-react";

import { sendTrackingSupportReply, sendTrackingSupportTyping } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTypingEmitter, type TypingIndicatorState } from "@/hooks/useSupportTyping";
import { cn } from "@/lib/utils";
import type { SupportProfile, TrackingSupportConversationEntry, TrackingSupportMessage } from "@/types";

const FAILURE_STATUSES = new Set(["bounced", "failed", "suppressed", "complained"]);

interface SupportConversationProps {
  ticket: TrackingSupportMessage;
  embedded?: boolean;
  customerTyping?: TypingIndicatorState;
  realtimeEnabled?: boolean;
  supportProfile?: SupportProfile;
}

type OptimisticEntry = TrackingSupportConversationEntry & {
  pending?: boolean;
};

export function SupportConversation({
  ticket,
  embedded = false,
  customerTyping,
  realtimeEnabled = true,
  supportProfile,
}: SupportConversationProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [pendingEntries, setPendingEntries] = useState<OptimisticEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEmailConversation = Boolean(ticket.customer_email);
  const isClosed = ticket.status === "closed";

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      void sendTrackingSupportTyping(ticket.id, isTyping).catch(() => {
        // Best-effort live presence; never block composer or surface toasts.
      });
    },
    [ticket.id],
  );

  const { notifyTyping, stopTyping } = useTypingEmitter(
    emitTyping,
    !isClosed && realtimeEnabled,
    ticket.id,
  );

  // Clear pending optimistic items belonging to previous tickets on switch
  useEffect(() => {
    setPendingEntries([]);
    setBody("");
  }, [ticket.id]);

  // Auto-grow composer textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [body]);

  const replyMutation = useMutation({
    mutationFn: ({ text }: { text: string; tempId: string }) =>
      sendTrackingSupportReply(ticket.id, text),
    onSuccess: (created, variables) => {
      setPendingEntries((prev) => prev.filter((item) => item.id !== variables.tempId));
      // Patch cached query data immediately so there's zero flicker before refetch finishes
      queryClient.setQueriesData<{ results?: TrackingSupportMessage[] }>(
        { queryKey: ["support-messages"] },
        (current) => {
          if (!current?.results) return current;
          return {
            ...current,
            results: current.results.map((item) => {
              if (item.id !== ticket.id) return item;
              if (item.conversation.some((entry) => entry.id === created.id)) return item;
              return {
                ...item,
                status: item.status === "new" ? "read" : item.status,
                updated_at: created.created_at,
                conversation: [...item.conversation, created],
              };
            }),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
    onError: (_err, variables) => {
      setPendingEntries((prev) => prev.filter((item) => item.id !== variables.tempId));
      setBody((current) => (current ? current : variables.text));
    },
  });

  const combinedConversation = useMemo<OptimisticEntry[]>(() => {
    if (!pendingEntries.length) return ticket.conversation;
    return [...ticket.conversation, ...pendingEntries];
  }, [pendingEntries, ticket.conversation]);

  const typingActive = Boolean(customerTyping?.active && !isClosed);
  const typingName = customerTyping?.name || ticket.customer_name || "Customer";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [ticket.id, combinedConversation.length, typingActive]);

  const submitReply = () => {
    const trimmed = body.trim();
    if (!trimmed || replyMutation.isPending) return;
    stopTyping();
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setPendingEntries((prev) => [
      ...prev,
      {
        id: tempId,
        direction: "owner",
        body: trimmed,
        sender_email: "",
        delivery_status: isEmailConversation ? "queued" : "received",
        created_at: new Date().toISOString(),
        pending: true,
      },
    ]);
    setBody("");
    replyMutation.mutate({ text: trimmed, tempId });
  };

  const ownerDisplayName = supportProfile?.display_name?.trim() || "You";
  const ownerAvatar = supportProfile?.avatar_url;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 space-y-4 overflow-y-auto py-5",
          embedded ? "px-4 sm:px-6" : "pr-2",
        )}
      >
        {combinedConversation.map((entry) => {
          const fromOwner = entry.direction === "owner";
          const isFailed = FAILURE_STATUSES.has(entry.delivery_status);
          return (
            <article
              key={entry.id}
              className={cn("flex flex-col", fromOwner ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "flex max-w-[86%] items-end gap-2 sm:max-w-[74%]",
                  fromOwner && "flex-row-reverse",
                )}
              >
                {fromOwner && ownerAvatar && (
                  <img
                    src={ownerAvatar}
                    alt={ownerDisplayName}
                    className="mb-0.5 size-7 shrink-0 rounded-full object-cover ring-1 ring-emerald-400/30"
                  />
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-6",
                    fromOwner
                      ? "rounded-br-sm border border-emerald-400/25 bg-emerald-500/18 text-white"
                      : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-white/90",
                    entry.pending && "opacity-75",
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{entry.body}</p>
                </div>
              </div>
              <div
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-white/40",
                  fromOwner ? "justify-end" : "justify-start",
                  fromOwner && ownerAvatar && "pr-9",
                )}
              >
                <span>{fromOwner ? ownerDisplayName : ticket.customer_name}</span>
                <span>·</span>
                <span>{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                {fromOwner &&
                  (entry.pending ? (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-white/50">
                        <Clock className="size-3" />
                        Sending
                      </span>
                    </>
                  ) : isEmailConversation || isFailed ? (
                    <>
                      <span>·</span>
                      <span className={cn("capitalize", isFailed && "text-red-300")}>
                        {entry.delivery_status}
                      </span>
                    </>
                  ) : (
                    <Check className="size-3 text-emerald-400/80" aria-label="Sent" />
                  ))}
              </div>
            </article>
          );
        })}

        {typingActive && (
          <div className="flex flex-col items-start" role="status" aria-live="polite">
            <div className="inline-flex items-center gap-2.5 rounded-2xl rounded-bl-sm border border-emerald-400/20 bg-white/[0.06] px-4 py-3 text-xs text-white/75">
              <span className="flex items-center gap-1" aria-hidden="true">
                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
              </span>
              <span>{typingName} is typing...</span>
            </div>
          </div>
        )}
      </div>

      <div
        data-testid="support-composer"
        className={cn(
          "shrink-0 border-t border-white/10",
          embedded ? "bg-white/[0.02] px-4 py-3 sm:px-5" : "pt-3 pb-1",
        )}
      >
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/50">
            <Lock className="size-3.5 text-white/35" />
            <span>This conversation is closed. Reopen it above to send a reply.</span>
          </div>
        ) : (
          <>
            <form
              className="flex items-end gap-2 rounded-xl border border-white/12 bg-white/[0.04] p-1.5 pl-3 transition focus-within:border-emerald-400/45 focus-within:bg-white/[0.06]"
              onSubmit={(event) => {
                event.preventDefault();
                submitReply();
              }}
            >
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => {
                  const next = event.target.value;
                  setBody(next);
                  notifyTyping(Boolean(next.trim()));
                }}
                onBlur={stopTyping}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    submitReply();
                  }
                }}
                placeholder={`Reply to ${ticket.customer_name}...`}
                rows={1}
                maxLength={10000}
                className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:border-0 focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 shrink-0 gap-1.5 rounded-lg px-3.5 font-semibold"
                disabled={!body.trim() || replyMutation.isPending}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                <span>{replyMutation.isPending ? "Sending" : "Send"}</span>
              </Button>
            </form>
            <div className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[11px] text-white/35">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                {ownerAvatar ? (
                  <img
                    src={ownerAvatar}
                    alt={ownerDisplayName}
                    className="size-3.5 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <Headphones className="size-3 shrink-0 text-white/35" />
                )}
                <span className="truncate">
                  {isEmailConversation
                    ? `Sends live & by email from ${ticket.source_label}`
                    : "Live chat · replies & typing appear immediately"}
                </span>
              </span>
              <span className="hidden shrink-0 sm:inline">Enter to send · Shift+Enter new line</span>
            </div>
          </>
        )}
        {replyMutation.isError && (
          <p className="mt-2 px-1 text-xs text-red-300">The reply could not be sent. Try again.</p>
        )}
      </div>
    </div>
  );
}
