import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, Braces, Eye, KeyRound, RefreshCw, Users } from "lucide-react";

import { getAdminApiCustomers, type AdminApiCustomer, type AdminApiCustomerStatus } from "@/api/apiEndpoints";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableControlChangeContext } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "1D", days: 1 }, { label: "7D", days: 7 },
  { label: "30D", days: 30 }, { label: "6M", days: 180 },
] as const;

const STATUS_STYLES: Record<AdminApiCustomerStatus, string> = {
  active: "border-green-500/20 bg-green-500/10 text-green-400",
  suspended: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  revoked: "border-red-500/20 bg-red-500/10 text-red-400",
};

function TrafficPulse({ trend }: { trend: Array<{ date: string; requests: number; errors: number }> }) {
  const totalRequests = trend.reduce((total, point) => total + point.requests, 0);
  if (totalRequests === 0) {
    return <div className="flex h-32 flex-col items-center justify-center text-center"><Activity className="mb-2 size-5 text-white/15" /><p className="text-[11px] text-white/30">No API requests in this period.</p></div>;
  }
  const max = Math.max(1, ...trend.map((point) => point.requests));
  return (
    <div className="flex h-32 items-end gap-1.5" aria-label="API request volume chart">
      {trend.map((point) => {
        const height = Math.max(4, Math.round((point.requests / max) * 100));
        const errorHeight = point.requests ? Math.round((point.errors / point.requests) * height) : 0;
        return (
          <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div className="relative w-full overflow-hidden rounded-t-md bg-primary/70 group-hover:bg-primary" style={{ height: `${height}%` }}>
              {errorHeight > 0 ? <div className="absolute inset-x-0 bottom-0 bg-red-400" style={{ height: `${Math.max(2, errorHeight)}%` }} /> : null}
            </div>
            <div className="pointer-events-none absolute -top-12 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-[10px] text-white shadow-2xl group-hover:block">
              {format(new Date(`${point.date}T00:00:00`), "MMM d")} · {point.requests} requests · {point.errors} errors
            </div>
          </div>
        );
      })}
    </div>
  );
}

function displayOperation(value: string) {
  return value.replace(/^v1-/, "").replace(/-/g, " ");
}

export default function ApiNetwork() {
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-api-customers", days, page, search, statusFilter],
    queryFn: () => getAdminApiCustomers({ days, page, search: search.trim(), status: statusFilter }),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const summary = data?.summary;
  const customers = data?.customers.results ?? [];
  const totalPages = data?.customers.total_pages ?? 1;
  const totalCustomers = data?.customers.count ?? 0;
  const statsCards: StatData[] = [
    { title: "API Customers", value: summary?.active_customers ?? 0, label: `${summary?.customers ?? 0} entitled accounts`, icon: Users, gradient: "from-blue-500/20 to-blue-600/5", borderColor: "border-blue-500/20", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { title: "Active Keys", value: summary?.active_keys ?? 0, label: "Live authenticated integrations", icon: KeyRound, gradient: "from-green-500/20 to-green-600/5", borderColor: "border-green-500/20", iconBg: "bg-green-500/10", iconColor: "text-green-400" },
    { title: "External Users", value: summary?.external_users ?? 0, label: `${summary?.active_external_users ?? 0} active in range`, icon: Braces, gradient: "from-violet-500/20 to-violet-600/5", borderColor: "border-violet-500/20", iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
    { title: "API Requests", value: summary?.requests ?? 0, label: summary?.success_rate == null ? "Collecting from this release" : `${summary.success_rate}% successful`, icon: Activity, gradient: "from-orange-500/20 to-orange-600/5", borderColor: "border-orange-500/20", iconBg: "bg-orange-500/10", iconColor: "text-orange-400" },
  ];

  const columns = useMemo<ColumnDef<AdminApiCustomer>[]>(() => [
    { id: "customer", header: "Customer", cell: ({ row }) => <div className="flex items-center gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">{row.original.user.username.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="max-w-[180px] truncate text-sm font-semibold text-white">{row.original.user.username}</p><p className="max-w-[200px] truncate text-[11px] text-white/30">{row.original.user.email}</p></div></div> },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize", STATUS_STYLES[row.original.status])}>{row.original.status}</span> },
    { id: "external_users", header: "External users", cell: ({ row }) => <div><p className="font-mono text-sm font-semibold text-white">{row.original.external_users}</p><p className="text-[10px] text-white/30">{row.original.active_external_users} active</p></div> },
    { id: "requests", header: "Requests", cell: ({ row }) => <div><p className="font-mono text-sm font-semibold text-white">{row.original.requests}</p><p className={cn("text-[10px]", row.original.errors ? "text-red-400" : "text-white/30")}>{row.original.errors} errors</p></div> },
    { id: "activity", header: "Sessions / docs", cell: ({ row }) => <span className="font-mono text-sm text-white/70">{row.original.sessions} / {row.original.documents}</span> },
    { id: "keys", header: "Keys", cell: ({ row }) => <span className="font-mono text-sm text-white/70">{row.original.active_keys}/{row.original.total_keys}</span> },
    { id: "last_activity", header: "Last activity", cell: ({ row }) => <span className="whitespace-nowrap text-xs text-white/40">{row.original.last_activity_at ? formatDistanceToNow(new Date(row.original.last_activity_at), { addSuffix: true }) : "Never"}</span> },
    { id: "actions", header: "Actions", cell: ({ row }) => <PremiumButton href={`/admin/api-network/${row.original.user.id}`} text="View" icon={Eye} variant="outline" className="border-white/10" /> },
  ], []);

  const filters = useMemo(() => [{
    key: "status", label: "Status", value: statusFilter,
    onChange: (value: string, context: DataTableControlChangeContext) => { setStatusFilter(value); setPage(context.nextPage); },
    options: [{ label: "All statuses", value: "all" }, { label: "Active", value: "active" }, { label: "Suspended", value: "suspended" }, { label: "Revoked", value: "revoked" }],
    placeholder: "Status",
  }], [statusFilter]);

  return (
    <div className="dashboard-content space-y-6 pb-24">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl font-bold italic tracking-tighter text-white">API <span className="text-primary">Management</span></h1><p className="mt-1 text-sm text-white/40">Monitor API customers and the users they bring through their integrations.</p></div>
        <div className="flex items-center gap-3"><div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 no-scrollbar">{RANGES.map((range) => <button key={range.days} type="button" onClick={() => { setDays(range.days); setPage(1); }} className={cn("rounded-full px-4 py-1.5 text-xs font-bold", days === range.days ? "bg-primary text-black" : "text-white/50 hover:text-white")}>{range.label}</button>)}</div><Button variant="outline" size="icon" onClick={() => refetch()} className="size-10 rounded-full border-white/10 bg-white/5" aria-label="Refresh API analytics"><RefreshCw className={cn("size-4", isFetching && "animate-spin")} /></Button></div>
      </header>
      <StatsCards stats={statsCards} isLoading={isLoading && !data} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_.7fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"><div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4"><div><h2 className="text-base font-semibold italic text-primary">Request <span className="text-white">Activity</span></h2><p className="text-[11px] text-white/35">Authenticated calls in the selected period</p></div><span className={cn("rounded-full border px-3 py-1 text-[10px]", summary?.errors ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-white/10 bg-white/5 text-white/40")}>{summary?.errors ?? 0} errors</span></div><TrafficPulse trend={data?.trend ?? []} /></section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"><div className="mb-4 border-b border-white/5 pb-4"><h2 className="text-base font-semibold italic text-violet-400">Top <span className="text-white">Operations</span></h2><p className="text-[11px] text-white/35">Most-used API actions</p></div><div className="space-y-2">{data?.operations.length ? data.operations.slice(0, 5).map((item) => <div key={`${item.method}-${item.operation}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"><div><p className="text-xs font-medium capitalize text-white/65">{displayOperation(item.operation)}</p><p className="font-mono text-[9px] text-primary/70">{item.method}</p></div><p className="font-mono text-xs text-white">{item.requests}</p></div>) : <div className="flex h-32 items-center justify-center text-[11px] text-white/30">No request activity yet.</div>}</div></section>
      </div>

      <div className="space-y-3">
        <div><h2 className="text-lg font-semibold italic text-primary">Customer <span className="text-white">Integrations</span></h2><p className="text-[11px] text-white/35">Only non-staff API customers are shown.</p></div>
        <DataTable columns={columns} data={customers} isLoading={isLoading} searchValue={search} onSearchChange={(value, context) => { setSearch(String(value)); setPage(context.nextPage); }} searchPlaceholder="Search customer, email, or key..." filters={filters} emptyMessage="No API customers found." hideColumnToggle enableSelection={false} pagination={{ page, pageSize: 20, totalItems: totalCustomers, totalPages, onPageChange: setPage }} />
      </div>
    </div>
  );
}
