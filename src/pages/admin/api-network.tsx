import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Braces,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleSlash2,
  ExternalLink,
  KeyRound,
  Loader2,
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
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "6M", days: 180 },
] as const;

const STATUS_STYLES: Record<AdminApiCustomerStatus, string> = {
  active: "border-green-500/20 bg-green-500/10 text-green-400",
  suspended: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  revoked: "border-red-500/20 bg-red-500/10 text-red-400",
};

function displayOperation(value: string) {
  return value.replace(/^v1-/, "").replace(/-/g, " ");
}

function lastSeen(value: string | null) {
  return value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : "No activity yet";
}

function TrafficPulse({ trend }: { trend: Array<{ date: string; requests: number; errors: number }> }) {
  const totalRequests = trend.reduce((total, point) => total + point.requests, 0);
  if (totalRequests === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center text-center">
        <Activity className="mb-2 size-5 text-white/15" />
        <p className="text-[11px] font-medium text-white/30">No API requests in this period.</p>
      </div>
    );
  }

  const max = Math.max(1, ...trend.map((point) => point.requests));

  return (
    <div className="flex h-32 items-end gap-1.5" aria-label="API request volume chart">
      {trend.map((point) => {
        const height = Math.max(4, Math.round((point.requests / max) * 100));
        const errorHeight = point.requests ? Math.round((point.errors / point.requests) * height) : 0;
        return (
          <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div
              className="relative w-full overflow-hidden rounded-t-lg bg-primary/70 transition-colors group-hover:bg-primary"
              style={{ height: `${height}%` }}
            >
              {errorHeight > 0 ? (
                <div className="absolute inset-x-0 bottom-0 bg-red-400/90" style={{ height: `${Math.max(2, errorHeight)}%` }} />
              ) : null}
            </div>
            <div className="pointer-events-none absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] text-white shadow-2xl group-hover:block">
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
    <article className="overflow-hidden border-b border-white/5 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="grid w-full grid-cols-1 gap-5 px-6 py-5 text-left transition-colors hover:bg-white/5 lg:grid-cols-[minmax(210px,1.45fr)_repeat(4,minmax(92px,.65fr))_36px] lg:items-center"
      >
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">{customer.user.username}</span>
            <span className={cn("rounded-full border px-2.5 py-1 text-[9px] font-bold", STATUS_STYLES[customer.status])}>
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
        <div className="border-t border-white/5 bg-white/[0.02] px-6 py-6">
          <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Integration keys</p>
                <span className="font-mono text-[10px] text-white/30">Activated {format(new Date(customer.activated_at), "MMM d, yyyy")}</span>
              </div>
              <div className="space-y-2">
                {customer.keys.length ? customer.keys.map((key) => (
                  <div key={key.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <KeyRound className={cn("size-3.5", key.is_active ? "text-primary" : "text-white/20")} />
                        <span className="text-xs font-medium text-white/80">{key.name}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[8px] font-bold", key.is_active ? "border-primary/20 bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-white/30")}>
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
                        className="h-8 self-start rounded-full px-3 text-[10px] text-red-400 hover:bg-red-500/10 hover:text-red-300 sm:self-auto"
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                )) : <p className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-white/30">No API keys issued.</p>}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <SmallMetric label="Completed" value={customer.completed_sessions} />
                <SmallMetric label="Renders" value={customer.renders} />
                <SmallMetric label="Failed" value={customer.failed_renders} danger={customer.failed_renders > 0} />
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">Allowed origins</p>
                {customer.allowed_origins.length ? (
                  <div className="space-y-1.5">
                    {customer.allowed_origins.map((origin) => (
                      <div key={origin} className="flex items-center gap-2 truncate font-mono text-[10px] text-white/55">
                        <ExternalLink className="size-3 shrink-0 text-primary/70" />{origin}
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
                  "h-10 w-full rounded-full border-white/10 bg-white/5 text-xs font-semibold",
                  nextStatus === "suspended" ? "text-yellow-400 hover:bg-yellow-500/10" : "text-primary hover:bg-primary/10",
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
      <p className={cn("mt-0.5 text-[9px]", warning ? "text-red-400" : "text-white/30")}>{accent}</p>
    </div>
  );
}

function SmallMetric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className={cn("font-mono text-lg font-semibold", danger ? "text-red-400" : "text-white")}>{value}</p>
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

  const statsCards: StatData[] = [
    {
      title: "API Customers",
      value: summary?.active_customers ?? 0,
      label: `${summary?.customers ?? 0} entitled accounts`,
      icon: Users,
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Active Keys",
      value: summary?.active_keys ?? 0,
      label: "Live authenticated integrations",
      icon: KeyRound,
      gradient: "from-green-500/20 to-green-600/5",
      borderColor: "border-green-500/20",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      title: "External Users",
      value: summary?.external_users ?? 0,
      label: `${summary?.active_external_users ?? 0} active in range`,
      icon: Braces,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
    },
    {
      title: "API Requests",
      value: summary?.requests ?? 0,
      label: summary?.success_rate == null ? "Collecting from this release" : `${summary.success_rate}% successful`,
      icon: Activity,
      gradient: "from-orange-500/20 to-orange-600/5",
      borderColor: "border-orange-500/20",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="dashboard-content space-y-6 pb-24">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold italic tracking-tighter text-white">
            API <span className="text-primary">Management</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/40">
            See which customers are connected, how many end users they bring, and what their integrations are doing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-bold tracking-tight">
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 no-scrollbar">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                onClick={() => { setDays(range.days); setPage(1); }}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200",
                  days === range.days ? "bg-primary text-black shadow" : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="size-10 rounded-full border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Refresh API analytics">
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </header>

      <StatsCards stats={statsCards} isLoading={isLoading} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_.7fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]">
          <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-5">
            <div>
              <p className="text-lg font-semibold italic tracking-tighter text-primary">Request <span className="text-white">Activity</span></p>
              <p className="mt-1 text-[11px] font-bold text-zinc-400">Authenticated calls; red marks show 4xx and 5xx responses.</p>
            </div>
            <div className="flex h-10 min-w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 px-3">
              <span className="font-mono text-[10px] text-red-400">{summary?.errors ?? 0} errors</span>
            </div>
          </div>
          <TrafficPulse trend={data?.trend ?? []} />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.07]">
          <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-5">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
              <Braces className="size-4 text-violet-400" />
            </div>
            <div>
              <p className="text-lg font-semibold italic tracking-tighter text-violet-400">Top <span className="text-white">Operations</span></p>
              <p className="text-[11px] font-bold text-zinc-400">Most-used API actions</p>
            </div>
          </div>
          <div className="space-y-2">
            {data?.operations.length ? data.operations.slice(0, 5).map((operation) => (
              <div key={`${operation.method}-${operation.operation}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold capitalize text-white/70">{displayOperation(operation.operation)}</p>
                  <p className="mt-0.5 font-mono text-[9px] text-primary/70">{operation.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-white">{operation.requests}</p>
                  {operation.errors ? <p className="text-[8px] text-red-400">{operation.errors} errors</p> : null}
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

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-white/5 bg-white/[0.02] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-lg font-semibold italic tracking-tighter text-primary">Customer <span className="text-white">Integrations</span></p>
            <p className="mt-1 text-[11px] font-bold text-zinc-400">{data?.customers.count ?? 0} customers match this view</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Search customer, email, or key"
                className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-9 pr-4 text-xs text-white outline-none transition-all placeholder:text-white/20 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 sm:w-72"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
              aria-label="Filter API customers by status"
              className="h-10 rounded-full border border-white/10 bg-white/5 px-4 text-xs font-semibold text-white/60 outline-none transition-all focus:border-primary/40"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-5 animate-spin text-primary" /></div>
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
          <div className="flex items-center justify-between border-t border-white/5 px-6 py-4">
            <p className="font-mono text-[10px] text-white/30">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-9 rounded-full border-white/10 bg-white/5" aria-label="Previous page"><ChevronLeft className="size-3.5" /></Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="size-9 rounded-full border-white/10 bg-white/5" aria-label="Next page"><ChevronRight className="size-3.5" /></Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
