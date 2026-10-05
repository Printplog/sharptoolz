import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Send } from "lucide-react";

import { sendTrackingSupportReply } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

const FAILURE_STATUSES = new Set(["bounced", "failed", "suppressed", "complained"]);

export function SupportConversation({ ticket }: { ticket: TrackingSupportMessage }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const replyMutation = useMutation({
    mutationFn: () => sendTrackingSupportReply(ticket.id, body.trim()),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    },
  });

  const submitReply = () => {
    if (body.trim() && !replyMutation.isPending) replyMutation.mutate();
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto py-6 pr-2">
        {ticket.conversation.map((entry) => {
          const fromOwner = entry.direction === "owner";
          return (
            <article key={entry.id} className={cn("flex", fromOwner ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[88%] rounded-xl px-4 py-3 sm:max-w-[72%]", fromOwner ? "border border-white/10 bg-white/10 text-white" : "bg-white/[0.05] text-white/75")}>
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{entry.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-white/30">
                  <span>{fromOwner ? "You" : ticket.customer_name}</span>
                  <span>·</span>
                  <span>{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                  {fromOwner && <><span>·</span><span className={cn(FAILURE_STATUSES.has(entry.delivery_status) && "text-red-200")}>{entry.delivery_status}</span></>}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-auto shrink-0 bg-[#0e1722]/95 pb-1 pt-4 backdrop-blur-md">
        <form
          className="rounded-2xl border border-white/10 bg-white/[0.045] p-2 shadow-[0_-12px_40px_rgba(4,10,18,0.18)] transition focus-within:border-white/20 focus-within:bg-white/[0.06]"
          onSubmit={(event) => {
            event.preventDefault();
            submitReply();
          }}
        >
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitReply();
              }
            }}
            placeholder={`Message ${ticket.customer_name}`}
            rows={1}
            maxLength={10000}
            className="max-h-40 min-h-12 resize-none border-0 bg-transparent px-3 py-3 shadow-none focus-visible:border-0 focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 px-1 pb-1">
            <p className="min-w-0 truncate pl-2 text-[11px] text-white/30">
              {ticket.customer_email ? `Sends by email from ${ticket.source_label}` : "Sends live in this conversation"}
            </p>
            <Button type="submit" size="sm" className="shrink-0 rounded-lg" disabled={!body.trim() || replyMutation.isPending}>
              <Send className="size-4" /> {replyMutation.isPending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
        {replyMutation.isError && <p className="mt-2 px-3 text-xs text-red-300">The reply could not be sent. Try again.</p>}
      </div>
    </div>
  );
}
