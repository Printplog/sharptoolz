import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Inbox, Mail, PackageSearch, Plane } from "lucide-react";

import { getTrackingSupportMessages } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrackingSupportMessage } from "@/types";

function SourceIcon({ source }: { source: TrackingSupportMessage["source"] }) {
  return source === "parcel_finda"
    ? <PackageSearch className="size-4" />
    : <Plane className="size-4" />;
}

export default function DocumentSupportMessages({ documentId }: { documentId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["support-messages", { documentId }],
    queryFn: () => getTrackingSupportMessages({ document_id: documentId }),
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

  if (!messages.length) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center text-center">
        <Inbox className="size-9 text-white/15" />
        <p className="mt-4 text-sm font-medium text-white/60">No support messages for this document</p>
        <p className="mt-2 max-w-md text-xs leading-5 text-white/30">
          Requests sent with this document&apos;s tracking ID will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/10 border-y border-white/10">
      {messages.map((message) => {
        const replySubject = encodeURIComponent(`Re: ${message.subject} [${message.tracking_id}]`);

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
                </div>
                <h3 className="mt-3 text-lg font-semibold text-white">{message.subject}</h3>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/65">{message.message}</p>
                <p className="mt-4 text-xs text-white/35">
                  From <span className="text-white/60">{message.customer_name}</span> · {message.customer_email}
                </p>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <a href={`mailto:${message.customer_email}?subject=${replySubject}`}>
                  <Mail /> Reply by email
                </a>
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
