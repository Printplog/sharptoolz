import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ArrowLeft, Check, Inbox, MessageSquareText, PackageSearch, Plane, Search, X } from "lucide-react";

import { getTrackingSupportMessages, updateTrackingSupportMessageStatus } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { SupportConversation } from "@/components/Dashboard/Support/SupportConversation";
import { SupportTicketDetailsDialog } from "@/components/Dashboard/Support/SupportTicketDetailsDialog";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

type Filter = "all" | TrackingSupportMessage["status"];

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "closed", label: "Closed" },
];

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
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-messages"],
    queryFn: () => getTrackingSupportMessages(),
  });

  const messages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.results ?? []).filter((message) => {
      const matchesFilter = filter === "all" || message.status === filter;
      const matchesSearch = !query || [message.tracking_id, message.customer_name, message.customer_email, message.subject, message.document_name]
        .some((value) => value.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [data?.results, filter, search]);

  const counts = useMemo(() => {
    const all = data?.results ?? [];
    return {
      all: all.length,
      new: all.filter((message) => message.status === "new").length,
      read: all.filter((message) => message.status === "read").length,
      closed: all.filter((message) => message.status === "closed").length,
    };
  }, [data?.results]);

  const selected = selectedId
    ? (data?.results ?? []).find((message) => message.id === selectedId) ?? null
    : messages[0] ?? null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrackingSupportMessage["status"] }) => updateTrackingSupportMessageStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["support-messages"], (current: typeof data) => current ? {
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
      </header>

      <div className={cn("flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-end sm:justify-between", selectedId && "hidden lg:flex")}>
          <CustomTabs
            tabs={FILTERS.map((item) => ({ id: item.value, label: item.label, count: counts[item.value] }))}
            activeTab={filter}
            onChange={(value) => setFilter(value as Filter)}
            className="max-w-full"
          />
          <div className="relative mb-3 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/25" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" className="h-9 border-white/10 bg-transparent pl-9" />
          </div>
      </div>

      <div className="grid h-[calc(100dvh-96px)] min-h-[560px] lg:h-[calc(100dvh-220px)] lg:min-h-[620px] lg:max-h-[820px] lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className={cn("min-h-[420px] flex-col border-b border-white/10 lg:flex lg:min-h-[620px] lg:border-b-0 lg:border-r", selectedId ? "hidden" : "flex")}>

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

        <section className={cn("h-full min-h-0 min-w-0 flex-col lg:flex lg:pl-8", selectedId ? "flex" : "hidden")}>
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

              <div className="min-h-0">
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
