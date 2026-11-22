import { format } from "date-fns";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { TrackingSupportMessage } from "@/types";

const DETAIL_ROWS: Array<{
  label: (ticket: TrackingSupportMessage) => string;
  value: (ticket: TrackingSupportMessage) => string;
}> = [
  { label: () => "Customer", value: (ticket) => ticket.customer_name },
  { label: () => "Email", value: (ticket) => ticket.customer_email || "Live chat" },
  {
    label: (ticket) => (ticket.source === "fernway" ? "Account" : "Tracking ID"),
    value: (ticket) => ticket.tracking_id,
  },
  {
    label: (ticket) => (ticket.source === "fernway" ? "Profile" : "Document"),
    value: (ticket) => ticket.document_name || "Untitled",
  },
  { label: () => "Source", value: (ticket) => ticket.source_label },
  { label: () => "Status", value: (ticket) => ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1) },
  { label: () => "Received", value: (ticket) => format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a") },
];

export function SupportTicketDetailsDialog({ ticket }: { ticket: TrackingSupportMessage }) {
  const detailLink = ticket.fernway_profile_id
    ? { to: `/online-banking/${ticket.fernway_profile_id}?tab=support`, label: "Open banking account" }
    : ticket.document_id
      ? { to: `/documents/${ticket.document_id}?tab=support`, label: "Open document" }
      : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">See details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 rounded-xl border-white/10 bg-[#101721] p-0">
        <DialogHeader className="border-b border-white/10 px-6 py-5 pr-12">
          <DialogTitle>Ticket details</DialogTitle>
          <DialogDescription className="text-white/40">
            Information connected to this support conversation.
          </DialogDescription>
        </DialogHeader>

        <dl className="px-6">
          {DETAIL_ROWS.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[96px_minmax(0,1fr)] gap-4 border-b border-white/[0.07] py-4 last:border-0">
              <dt className="text-sm text-white/35">{row.label(ticket)}</dt>
              <dd className="min-w-0 break-words text-sm text-white/75">{row.value(ticket)}</dd>
            </div>
          ))}
        </dl>

        {detailLink && (
          <div className="border-t border-white/10 px-6 py-4">
            <Button asChild className="w-full">
              <Link to={detailLink.to}>{detailLink.label}</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
