import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  Braces,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleSlash2,
  ExternalLink,
  KeyRound,
  Loader2,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminApiCustomers,
  revokeAdminApiKey,
  updateAdminApiCustomerStatus,
  type AdminApiCustomer,
  type AdminApiCustomerStatus,
} from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "6M", days: 180 },
] as const;

const STATUS_STYLES: Record<AdminApiCustomerStatus, string> = {
  active: "border-cyan-400/20 bg-cyan-400/10 text-cyan-200",
  suspended: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  revoked: "border-rose-400/20 bg-rose-400/10 text-rose-200",
};

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function displayOperation(value: string) {
  return value.replace(/^v1-/, "").replace(/-/g, " ");
}

function lastSeen(value: string | null) {
  return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "No activity yet";
}

function TrafficPulse({ trend }: { trend: Array<{ date: string; requests: number; errors: number }> }) {
  const max = Math.max(1, ...trend.map((point) => point.requests));

  return (
    <div className="flex h-32 items-end gap-1.5" aria-label="API request volume chart">
      {trend.map((point) => {
        const height = Math.max(4, Math.round((point.requests / max) * 100));
        const errorHeight = point.requests ? Math.round((point.errors / point.requests) * height) : 0;
        return (
          <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div
              className="relative w-full overflow-hidden rounded-t-sm bg-cyan-300/70 transition-colors group-hover:bg-cyan-200"
              style={{ height: `${height}%` }}
            >
              {errorHeight > 0 ? (
                <div className="absolute inset-x-0 bottom-0 bg-rose-400/90" style={{ height: `${Math.max(2, errorHeight)}%` }} />
              ) : null}
            </div>
            <div className="pointer-events-none absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#101820] px-2 py-1 text-[10px] text-white shadow-xl group-hover:block">
              {format(new Date(`${point.date}T00:00:00`), "MMM d")} · {point.requests} requests · {point.errors} errors
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerRow({
  customer,
  onStatusChange,
  onRevokeKey,
  isUpdating,
}: {
  customer: AdminApiCustomer;
  onStatusChange: (userId: number, status: AdminApiCustomerStatus) => void;
  onRevokeKey: (userId: number, keyId: string) => void;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const nextStatus = customer.status === "active" ? "suspended" : "active";

  return (
    <article className="overflow-hidden border-b border-white/[0.07] last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="grid w-full grid-cols-1 gap-5 px-5 py-5 text-left transition-colors hover:bg-white/[0.025] lg:grid-cols-[minmax(210px,1.45fr)_repeat(4,minmax(92px,.65fr))_36px] lg:items-center"
      >
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{customer.user.username}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]", STATUS_STYLES[customer.status])}>
              {customer.status}
            </span>
          </div>
          <p className="truncate text-xs text-white/40">{customer.user.email}</p>
          <p className="mt-1 text-[10px] text-white/25">Last signal {lastSeen(customer.last_activity_at)}</p>
        </div>
        <Metric label="External users" value={customer.external_users} accent={`${customer.active_external_users} active`} />
        <Metric label="Requests" value={customer.requests} accent={`${customer.errors} errors`} warning={customer.errors > 0} />
        <Metric label="Sessions / docs" value={`${customer.sessions} / ${customer.documents}`} accent={`${customer.paid_documents} paid docs`} />
        <Metric label="Keys" value={`${customer.active_keys}/${customer.total_keys}`} accent="active / total" />
        <ChevronDown className={cn("hidden size-4 text-white/30 transition-transform lg:block", expanded && "rotate-180")} />
      </button>

      {expanded ? (
        <div className="border-t border-white/[0.06] bg-black/15 px-5 py-5">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Integration keys</p>
                <span className="font-mono text-[10px] text-white/30">Activated {format(new Date(customer.activated_at), "MMM d, yyyy")}</span>
              </div>
              <div className="space-y-2">
                {customer.keys.length ? customer.keys.map((key) => (
                  <div key={key.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <KeyRound className={cn("size-3.5", key.is_active ? "text-cyan-300" : "text-white/20")} />
                        <span className="text-xs font-medium text-white/80">{key.name}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase", key.is_active ? "bg-cyan-400/10 text-cyan-200" : "bg-white/5 text-white/30")}>
                          {key.is_active ? "live" : "inactive"}
                        </span>
                      </div>
                      <p className="mt-1 truncate font-mono text-[10px] text-white/35">{key.prefix}•••••••• · {lastSeen(key.last_used_at)}</p>
                    </div>
                    {key.is_active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevokeKey(customer.user.id, key.id)}
                        className="h-7 self-start rounded-lg px-2 text-[10px] text-rose-300 hover:bg-rose-400/10 hover:text-rose-200 sm:self-auto"
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                )) : <p className="rounded-xl border border-dashed border-white/10 p-4 text-xs text-white/30">No API keys issued.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <SmallMetric label="Completed" value={customer.completed_sessions} />
                <SmallMetric label="Renders" value={customer.renders} />
                <SmallMetric label="Failed" value={customer.failed_renders} danger={customer.failed_renders > 0} />
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">Allowed origins</p>
                {customer.allowed_origins.length ? (
                  <div className="space-y-1.5">
                    {customer.allowed_origins.map((origin) => (
                      <div key={origin} className="flex items-center gap-2 truncate font-mono text-[10px] text-white/55">
                        <ExternalLink className="size-3 shrink-0 text-cyan-300/70" />{origin}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[10px] text-amber-200/70">No customer-wide origins configured.</p>}
              </div>
              <Button
                variant="outline"
                disabled={isUpdating || customer.status === "revoked"}
                onClick={() => onStatusChange(customer.user.id, nextStatus)}
                className={cn(
                  "h-9 w-full rounded-xl border-white/10 bg-transparent text-xs",
                  nextStatus === "suspended" ? "text-amber-200 hover:bg-amber-400/10" : "text-cyan-200 hover:bg-cyan-400/10",
                )}
              >
                {isUpdating ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : nextStatus === "suspended" ? <CircleSlash2 className="mr-2 size-3.5" /> : <RefreshCw className="mr-2 size-3.5" />}
                {nextStatus === "suspended" ? "Suspend API access" : "Restore API access"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value, accent, warning = false }: { label: string; value: string | number; accent: string; warning?: boolean }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/25">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-white/85">{value}</p>
      <p className={cn("mt-0.5 text-[9px]", warning ? "text-rose-300" : "text-white/30")}>{accent}</p>
    </div>
  );
}

function SmallMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <p className={cn("font-mono text-lg font-semibold", danger ? "text-rose-300" : "text-white")}>{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/30">{label}</p>
    </div>
  );
}

export default function ApiNetwork() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const deferredSearch = useDeferredValue(search.trim());
  const queryClient = useQueryClient();

  const queryKey = ["admin-api-customers", days, page, deferredSearch, statusFilter];
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => getAdminApiCustomers({ days, page, search: deferredSearch, status: statusFilter }),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: AdminApiCustomerStatus }) => updateAdminApiCustomerStatus(userId, status),
    onSuccess: (result) => {
      toast.success(result.status === "active" ? "API access restored" : "API access suspended");
      queryClient.invalidateQueries({ queryKey: ["admin-api-customers"] });
    },
    onError: () => toast.error("Could not update API access."),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, keyId }: { userId: number; keyId: string }) => revokeAdminApiKey(userId, keyId),
    onSuccess: () => {
      toast.success("API key revoked");
      queryClient.invalidateQueries({ queryKey: ["admin-api-customers"] });
    },
    onError: () => toast.error("Could not revoke API key."),
  });

  const summary = data?.summary;
  const totalPages = data?.customers.total_pages ?? 1;

  const changeStatus = (userId: number, status: AdminApiCustomerStatus) => {
    statusMutation.mutate({ userId, status });
  };

  const revokeKey = (userId: number, keyId: string) => {
    if (window.confirm("Revoke this API key? Existing integrations using it will stop immediately.")) {
      revokeMutation.mutate({ userId, keyId });
    }
  };

  return (
    <div className="dashboard-content space-y-6 pb-24">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
            <Network className="size-3.5" /> Partner operations
          </div>
          <h1 className="text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">API network</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            See which customers are connected, how many end users they bring, and what their integrations are doing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-white/[0.025] p-1">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => { setDays(range.days); setPage(1); }}
                className={cn("rounded-lg px-3 py-1.5 text-[10px] font-bold transition-colors", days === range.days ? "bg-cyan-300 text-[#071014]" : "text-white/35 hover:text-white")}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="size-9 rounded-xl border-white/10 bg-white/[0.025] text-white/50 hover:text-white" aria-label="Refresh API analytics">
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-cyan-300/10 bg-[#0d151d] shadow-[0_30px_80px_rgba(0,0,0,.24)]">
        <div className="grid md:grid-cols-4">
          <FlowNode icon={Users} label="Customers" value={summary?.active_customers ?? 0} detail={`${summary?.customers ?? 0} entitled`} />
          <FlowNode icon={KeyRound} label="Live keys" value={summary?.active_keys ?? 0} detail="authenticated lanes" connected />
          <FlowNode icon={Braces} label="External users" value={summary?.external_users ?? 0} detail={`${summary?.active_external_users ?? 0} active in range`} connected />
          <FlowNode icon={Activity} label="API requests" value={summary?.requests ?? 0} detail={summary?.success_rate == null ? "collecting from this release" : `${summary.success_rate}% successful`} connected />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_.7fr]">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white">Request pulse</p>
              <p className="mt-1 text-[10px] text-white/30">Authenticated public API calls; red marks indicate 4xx/5xx responses.</p>
            </div>
            <span className="font-mono text-[10px] text-white/30">{summary?.errors ?? 0} errors</span>
          </div>
          <TrafficPulse trend={data?.trend ?? []} />
        </section>

        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Braces className="size-4 text-cyan-300" />
            <p className="text-xs font-semibold text-white">Top operations</p>
          </div>
          <div className="space-y-2">
            {data?.operations.length ? data.operations.slice(0, 5).map((operation) => (
              <div key={`${operation.method}-${operation.operation}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium capitalize text-white/65">{displayOperation(operation.operation)}</p>
                  <p className="mt-0.5 font-mono text-[8px] text-cyan-300/60">{operation.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-white">{operation.requests}</p>
                  {operation.errors ? <p className="text-[8px] text-rose-300">{operation.errors} errors</p> : null}
                </div>
              </div>
            )) : (
              <div className="flex min-h-28 flex-col items-center justify-center text-center">
                <Activity className="mb-2 size-5 text-white/15" />
                <p className="text-[10px] text-white/30">Request telemetry begins with this release.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d131a]">
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Customer integrations</p>
            <p className="mt-1 text-[10px] text-white/30">{data?.customers.count ?? 0} customers match this view</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search customer, email, or key"
                className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.025] pl-9 pr-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-cyan-300/30 sm:w-64"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
              aria-label="Filter API customers by status"
              className="h-9 rounded-xl border border-white/10 bg-[#111820] px-3 text-xs text-white/60 outline-none focus:border-cyan-300/30"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-5 animate-spin text-cyan-300" /></div>
        ) : data?.customers.results.length ? (
          data.customers.results.map((customer) => (
            <CustomerRow
              key={customer.user.id}
              customer={customer}
              onStatusChange={changeStatus}
              onRevokeKey={revokeKey}
              isUpdating={statusMutation.isPending || revokeMutation.isPending}
            />
          ))
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <ShieldAlert className="mb-3 size-7 text-white/15" />
            <p className="text-sm text-white/50">No API customers found</p>
            <p className="mt-1 text-[10px] text-white/25">Try another status or search term.</p>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-3">
            <p className="font-mono text-[10px] text-white/30">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-8 rounded-lg border-white/10 bg-transparent" aria-label="Previous page"><ChevronLeft className="size-3.5" /></Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="size-8 rounded-lg border-white/10 bg-transparent" aria-label="Next page"><ChevronRight className="size-3.5" /></Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function FlowNode({ icon: Icon, label, value, detail, connected = false }: { icon: typeof Users; label: string; value: number; detail: string; connected?: boolean }) {
  return (
    <div className="relative border-b border-white/[0.06] p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      {connected ? <ArrowRight className="absolute -left-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-[#0d151d] p-1 text-cyan-300/40 md:block" /> : null}
      <div className="flex items-start justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/30">{label}</p>
        <Icon className="size-4 text-cyan-300/55" />
      </div>
      <p className="mt-5 font-mono text-3xl font-semibold tracking-[-0.05em] text-white">{compactNumber(value)}</p>
      <p className="mt-1 text-[10px] text-white/30">{detail}</p>
    </div>
  );
}
