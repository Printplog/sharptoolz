import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, Loader2, Lock, Send } from "lucide-react";

import { sendTrackingSupportReply } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

const FAILURE_STATUSES = new Set(["bounced", "failed", "suppressed", "complained"]);

interface SupportConversationProps {
  ticket: TrackingSupportMessage;
  embedded?: boolean;
}

export function SupportConversation({ ticket, embedded = false }: SupportConversationProps) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const replyMutation = useMutation({
    mutationFn: () => sendTrackingSupportReply(ticket.id, body.trim()),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [ticket.id, ticket.conversation.length]);

  const submitReply = () => {
    if (body.trim() && !replyMutation.isPending) replyMutation.mutate();
  };

  const isEmailConversation = Boolean(ticket.customer_email);
  const isClosed = ticket.status === "closed";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className={cn(
          "min-h-0 flex-1 space-y-4 overflow-y-auto py-5",
          embedded ? "px-4 sm:px-6" : "pr-2",
        )}
      >
        {ticket.conversation.map((entry) => {
          const fromOwner = entry.direction === "owner";
          const isFailed = FAILURE_STATUSES.has(entry.delivery_status);
          return (
            <article
              key={entry.id}
              className={cn("flex flex-col", fromOwner ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[84%] rounded-2xl px-4 py-2.5 text-sm leading-6 sm:max-w-[70%]",
                  fromOwner
                    ? "rounded-br-sm border border-emerald-400/25 bg-emerald-500/18 text-white"
                    : "rounded-bl-sm border border-white/10 bg-white/[0.06] text-white/90",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{entry.body}</p>
              </div>
              <div
                className={cn(
                  "mt-1.5 flex items-center gap-1.5 px-1 text-[11px] text-white/40",
                  fromOwner ? "justify-end" : "justify-start",
                )}
              >
                <span>{fromOwner ? "You" : ticket.customer_name}</span>
                <span>·</span>
                <span>{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                {fromOwner &&
                  (isEmailConversation || isFailed ? (
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
                value={body}
                onChange={(event) => setBody(event.target.value)}
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
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-white/35">
              <span className="truncate">
                {isEmailConversation
                  ? `Sends by email from ${ticket.source_label}`
                  : "Live chat · replies appear immediately"}
              </span>
              <span className="hidden shrink-0 sm:inline">Enter to send</span>
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
