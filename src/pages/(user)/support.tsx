import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Check, Inbox, MessageSquareText, PackageSearch, Plane, Search, X } from "lucide-react";

import { getTrackingSupportMessages, updateTrackingSupportMessageStatus } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { SupportConversation } from "@/components/Dashboard/Support/SupportConversation";
import { SupportHowItWorksDialog } from "@/components/Dashboard/Support/SupportHowItWorksDialog";
import { SupportTicketDetailsDialog } from "@/components/Dashboard/Support/SupportTicketDetailsDialog";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";

type Filter = "all" | TrackingSupportMessage["status"];
type ConversationType = "all" | "live" | "email";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "closed", label: "Closed" },
];

const CONVERSATION_TYPES: Array<{ value: ConversationType; label: string }> = [
  { value: "all", label: "All messages" },
  { value: "live", label: "Live chat" },
  { value: "email", label: "Email support" },
];

function isConversationType(message: TrackingSupportMessage, type: ConversationType) {
  if (type === "all") return true;
  return type === "email" ? Boolean(message.customer_email) : !message.customer_email;
}

function useNotificationSound() {
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    const enableSound = () => {
      const AudioContextClass = window.AudioContext
        ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext.current ??= new AudioContextClass();
      if (audioContext.current.state === "suspended") void audioContext.current.resume();
    };
    window.addEventListener("pointerdown", enableSound, { once: true });
    window.addEventListener("keydown", enableSound, { once: true });
    return () => {
      window.removeEventListener("pointerdown", enableSound);
      window.removeEventListener("keydown", enableSound);
      if (audioContext.current) void audioContext.current.close();
    };
  }, []);

  return useCallback(() => {
    const context = audioContext.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now);
    oscillator.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.065, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }, []);
}

function SourceIcon({ source }: { source: TrackingSupportMessage["source"] }) {
  return source === "parcel_finda" ? <PackageSearch className="size-4" /> : <Plane className="size-4" />;
}

function MessageListSkeleton() {
  return <div className="space-y-px">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 animate-pulse border-b border-white/5 bg-white/[0.025]" />)}</div>;
}

export default function SupportMessagesPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [conversationType, setConversationType] = useState<ConversationType>("all");
  const [search, setSearch] = useState("");
  const playNotification = useNotificationSound();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-messages"],
    queryFn: () => getTrackingSupportMessages(),
  });
  const refreshMessages = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["support-messages"] });
  }, [queryClient]);
  useSupportRealtime({
    config: data?.realtime,
    channel: data?.channel,
    onUpdate: refreshMessages,
    onIncomingMessage: playNotification,
  });

  const messagesForType = useMemo(
    () => (data?.results ?? []).filter((message) => isConversationType(message, conversationType)),
    [conversationType, data?.results],
  );

  const messages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messagesForType.filter((message) => {
      const matchesFilter = filter === "all" || message.status === filter;
      const matchesSearch = !query || [message.tracking_id, message.customer_name, message.customer_email, message.subject, message.document_name]
        .some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [filter, messagesForType, search]);

  const counts = useMemo(() => {
    const all = messagesForType;
    return {
      all: all.length,
      new: all.filter((message) => message.status === "new").length,
      read: all.filter((message) => message.status === "read").length,
      closed: all.filter((message) => message.status === "closed").length,
    };
  }, [messagesForType]);

  const typeCounts = useMemo(() => {
    const all = data?.results ?? [];
    return {
      all: all.length,
      live: all.filter((message) => !message.customer_email).length,
      email: all.filter((message) => Boolean(message.customer_email)).length,
    };
  }, [data?.results]);

  const selected = selectedId
    ? (data?.results ?? []).find((message) => message.id === selectedId) ?? null
    : messages[0] ?? null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrackingSupportMessage["status"] }) => updateTrackingSupportMessageStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["support-messages"], (current: typeof data) => current ? {
        ...current,
        results: current.results.map((message) => message.id === updated.id ? updated : message),
        unread_count: current.results.filter((message) => (message.id === updated.id ? updated : message).status === "new").length,
      } : current);
    },
  });

  const selectMessage = (message: TrackingSupportMessage) => {
    setSelectedId(message.id);
    if (message.status === "new") statusMutation.mutate({ id: message.id, status: "read" });
  };

  return (
    <div className="dashboard-content pb-12">
      <header className={cn("flex flex-col justify-between gap-4 pb-6 sm:flex-row sm:items-end", selectedId && "hidden lg:flex")}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Support Messages</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Requests from ParcelFinda and MyFlightLookup for tracking IDs you created.</p>
        </div>
        <SupportHowItWorksDialog />
      </header>

      <div className={cn("flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-end sm:justify-between", selectedId && "hidden lg:flex")}>
          <CustomTabs
            tabs={CONVERSATION_TYPES.map((item) => ({ id: item.value, label: item.label, count: typeCounts[item.value] }))}
            activeTab={conversationType}
            onChange={(value) => {
              setConversationType(value as ConversationType);
              setSelectedId(null);
            }}
            ariaLabel="Support message type"
            className="max-w-full"
          />
          <div className="mb-3 flex w-full gap-2 sm:w-auto">
            <Select
              value={filter}
              onValueChange={(value) => {
                setFilter(value as Filter);
                setSelectedId(null);
              }}
            >
              <SelectTrigger aria-label="Filter by status" className="h-9 w-[132px] shrink-0 border-white/10 bg-transparent text-white/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTERS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label} ({counts[item.value]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" className="h-9 border-white/10 bg-transparent pl-9" />
            </div>
          </div>
      </div>

      <div className="grid h-[calc(100dvh-166px)] min-h-[480px] lg:h-[calc(100dvh-226px)] lg:min-h-[480px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className={cn("min-h-[420px] flex-col border-b border-white/10 lg:flex lg:min-h-0 lg:border-b-0 lg:border-r", selectedId ? "hidden" : "flex")}>

          {isLoading ? <MessageListSkeleton /> : isError ? (
            <div className="py-10 pr-6 text-sm text-red-300">Support messages could not be loaded.</div>
          ) : messages.length ? (
            <div className="max-h-[620px] overflow-y-auto pr-4">{messages.map((message) => (
              <button key={message.id} type="button" onClick={() => selectMessage(message)} className={cn("w-full border-b border-white/10 py-4 text-left transition hover:text-white", selectedId === message.id && "border-b-primary/50", message.status === "new" && "font-medium")}>
                <div className="flex items-start justify-between gap-3"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-white/70"><SourceIcon source={message.source} /><span className="truncate">{message.source_label}</span></span><span className="shrink-0 text-[10px] text-white/30">{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span></div>
                <p className={cn("mt-3 truncate text-sm text-white/75", message.status === "new" && "font-bold text-white")}>{message.subject}</p>
                <p className="mt-1 truncate text-xs text-white/35">{message.customer_name} · {message.tracking_id}</p>
              </button>
            ))}</div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><Inbox className="size-8 text-white/15" /><p className="mt-4 text-sm font-medium text-white/55">No messages here</p><p className="mt-2 text-xs leading-5 text-white/30">New tracking support requests will appear automatically.</p></div>
          )}
        </section>

        <section className={cn("h-full min-h-0 min-w-0 flex-col overflow-hidden lg:flex lg:pl-8", selectedId ? "flex" : "hidden")}>
          {selected ? (
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)]">
              <div className="border-b border-white/10 py-6">
                <button type="button" onClick={() => setSelectedId(null)} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white lg:hidden">
                  <ArrowLeft className="size-4" /> Back to messages
                </button>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs text-white/40"><span className={cn("flex items-center gap-1.5", selected.source === "parcel_finda" ? "text-emerald-300" : "text-sky-300")}><SourceIcon source={selected.source} />{selected.source_label}</span><span>·</span><span className="capitalize">{selected.status}</span></div><h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{selected.subject}</h2><p className="mt-2 text-xs text-white/35">Received {format(new Date(selected.created_at), "MMM d, yyyy 'at' h:mm a")}</p></div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <SupportTicketDetailsDialog ticket={selected} />
                    {selected.status === "closed" ? <Button variant="outline" onClick={() => statusMutation.mutate({ id: selected.id, status: "read" })}><Check /> Reopen</Button> : <Button variant="outline" onClick={() => statusMutation.mutate({ id: selected.id, status: "closed" })}><X /> Close</Button>}
                  </div>
                </div>
              </div>

              <div className="h-full min-h-0 overflow-hidden">
                <SupportConversation ticket={selected} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center"><MessageSquareText className="size-10 text-white/10" /><p className="mt-4 text-sm text-white/35">Select a support message to read it.</p></div>
          )}
        </section>
      </div>
    </div>
  );
}
