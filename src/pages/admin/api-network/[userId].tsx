import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Braces,
  FileText,
  KeyRound,
  Loader,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  getAdminApiCustomer,
  revokeAdminApiKey,
  updateAdminApiCustomerStatus,
  type AdminApiActivityEvent,
  type AdminApiCustomerStatus,
  type AdminApiExternalUser,
  type AdminApiKeySummary,
} from "@/api/apiEndpoints";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import { Button } from "@/components/ui/button";
import { CustomTabs, CustomTabsContent } from "@/components/ui/custom-tabs";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "6M", days: 180 },
] as const;

const STATUS_STYLES: Record<AdminApiCustomerStatus, string> = {
  active: "border-green-500/20 bg-green-500/10 text-green-400",
  suspended: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  revoked: "border-red-500/20 bg-red-500/10 text-red-400",
};

function operationLabel(value: string) {
  return value.replace(/^v1-/, "").replace(/-/g, " ");
}

function readableError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ApiCustomerDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-api-customer", userId, days],
    queryFn: () => getAdminApiCustomer(userId!, days),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: (status: AdminApiCustomerStatus) =>
      updateAdminApiCustomerStatus(Number(userId), status),
    onSuccess: async (_, status) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-api-customer", userId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-api-customers"] }),
      ]);
      toast.success(`API access ${status === "active" ? "restored" : status}.`);
    },
    onError: (mutationError) => toast.error(readableError(mutationError, "Could not update API access.")),
  });

  const revokeKeyMutation = useMutation({
    mutationFn: (keyId: string) => revokeAdminApiKey(Number(userId), keyId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-api-customer", userId] }),
        queryClient.invalidateQueries({ queryKey: ["admin-api-customers"] }),
      ]);
      toast.success("API key revoked.");
    },
    onError: (mutationError) => toast.error(readableError(mutationError, "Could not revoke API key.")),
  });
  const revokeKey = revokeKeyMutation.mutate;
  const isRevokingKey = revokeKeyMutation.isPending;

  const keyColumns = useMemo<ColumnDef<AdminApiKeySummary>[]>(() => [
    {
      accessorKey: "name",
      header: "Key",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-white">{row.original.name}</p>
          <p className="font-mono text-[10px] text-white/35">{row.original.prefix}••••••••</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={cn(
          "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
          row.original.is_active
            ? "border-green-500/20 bg-green-500/10 text-green-400"
            : "border-white/10 bg-white/5 text-white/35",
        )}>
          {row.original.is_active ? "Active" : "Revoked"}
        </span>
      ),
    },
    {
      id: "origins",
      header: "Origins",
      cell: ({ row }) => <span className="text-xs text-white/55">{row.original.allowed_origins.length || "Account default"}</span>,
    },
    {
      accessorKey: "last_used_at",
      header: "Last used",
      cell: ({ row }) => <span className="whitespace-nowrap text-xs text-white/45">{row.original.last_used_at ? formatDistanceToNow(new Date(row.original.last_used_at), { addSuffix: true }) : "Never"}</span>,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => <span className="whitespace-nowrap text-xs text-white/45">{format(new Date(row.original.created_at), "MMM d, yyyy")}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!row.original.is_active || isRevokingKey}
          onClick={() => {
            if (window.confirm(`Revoke ${row.original.name}? This cannot be undone.`)) {
              revokeKey(row.original.id);
            }
          }}
          className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          Revoke
        </Button>
      ),
    },
  ], [isRevokingKey, revokeKey]);

  const externalUserColumns = useMemo<ColumnDef<AdminApiExternalUser>[]>(() => [
    { accessorKey: "external_user_id", header: "External user ID", cell: ({ row }) => <span className="font-mono text-xs text-white/75">{row.original.external_user_id}</span> },
    { accessorKey: "requests", header: "Requests", cell: ({ row }) => <span className="font-mono text-sm text-white">{row.original.requests}</span> },
    { accessorKey: "sessions", header: "Sessions", cell: ({ row }) => <span className="font-mono text-sm text-white">{row.original.sessions}</span> },
    { accessorKey: "documents", header: "Documents", cell: ({ row }) => <span className="font-mono text-sm text-white">{row.original.documents}</span> },
    { accessorKey: "last_seen_at", header: "Last seen", cell: ({ row }) => <span className="whitespace-nowrap text-xs text-white/45">{formatDistanceToNow(new Date(row.original.last_seen_at), { addSuffix: true })}</span> },
  ], []);

  const activityColumns = useMemo<ColumnDef<AdminApiActivityEvent>[]>(() => [
    { accessorKey: "operation", header: "Operation", cell: ({ row }) => <span className="text-xs font-medium capitalize text-white/75">{operationLabel(row.original.operation)}</span> },
    { accessorKey: "method", header: "Method", cell: ({ row }) => <span className="font-mono text-[10px] font-semibold text-primary">{row.original.method}</span> },
    { accessorKey: "status_code", header: "Status", cell: ({ row }) => <span className={cn("font-mono text-xs", row.original.status_code >= 400 ? "text-red-400" : "text-green-400")}>{row.original.status_code}</span> },
    { accessorKey: "external_user_id", header: "External user", cell: ({ row }) => <span className="max-w-[180px] truncate font-mono text-xs text-white/45">{row.original.external_user_id || "—"}</span> },
    { accessorKey: "key_prefix", header: "Key", cell: ({ row }) => <span className="font-mono text-xs text-white/45">{row.original.key_prefix || "—"}</span> },
    { accessorKey: "duration_ms", header: "Duration", cell: ({ row }) => <span className="font-mono text-xs text-white/55">{row.original.duration_ms} ms</span> },
    { accessorKey: "created_at", header: "Time", cell: ({ row }) => <span className="whitespace-nowrap text-xs text-white/45">{format(new Date(row.original.created_at), "MMM d, HH:mm:ss")}</span> },
  ], []);

  if (isLoading) {
    return <div className="flex min-h-[45vh] items-center justify-center text-white/50"><Loader className="mr-3 size-5 animate-spin" />Loading API customer…</div>;
  }

  if (error || !data) {
    return (
      <div className="dashboard-content space-y-6">
        <Link to="/admin/api-network"><Button variant="outline" className="rounded-full border-white/10 bg-white/5"><ArrowLeft className="size-4" />Back to API management</Button></Link>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-300">{readableError(error, "API customer not found.")}</div>
      </div>
    );
  }

  const { customer } = data;
  const stats: StatData[] = [
    { title: "Requests", value: customer.requests, label: customer.success_rate == null ? "No requests in range" : `${customer.success_rate}% successful`, icon: Activity, gradient: "from-blue-500/20 to-blue-600/5", borderColor: "border-blue-500/20", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { title: "External Users", value: customer.external_users, label: `${customer.active_external_users} active in range`, icon: Users, gradient: "from-violet-500/20 to-violet-600/5", borderColor: "border-violet-500/20", iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
    { title: "Documents", value: customer.documents, label: `${customer.paid_documents} paid documents`, icon: FileText, gradient: "from-orange-500/20 to-orange-600/5", borderColor: "border-orange-500/20", iconBg: "bg-orange-500/10", iconColor: "text-orange-400" },
    { title: "Active Keys", value: customer.active_keys, label: `${customer.total_keys} keys issued`, icon: KeyRound, gradient: "from-green-500/20 to-green-600/5", borderColor: "border-green-500/20", iconBg: "bg-green-500/10", iconColor: "text-green-400" },
  ];
  const tabs = [
    { id: "overview", label: "Overview", icon: ShieldCheck },
    { id: "keys", label: "API keys", icon: KeyRound },
    { id: "users", label: "External users", icon: Braces },
    { id: "activity", label: "Request activity", icon: Activity },
  ];

  return (
    <div className="dashboard-content space-y-7 pb-24">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/api-network"><Button variant="outline" size="icon" className="size-11 shrink-0 rounded-full border-white/10 bg-white/5"><ArrowLeft className="size-4" /></Button></Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-bold italic tracking-tighter text-white">{customer.user.username} <span className="text-primary">API</span></h1>
              <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize", STATUS_STYLES[customer.status])}>{customer.status}</span>
            </div>
            <p className="mt-1 truncate text-xs text-white/40">{customer.user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">{RANGES.map((range) => <button key={range.days} type="button" onClick={() => setDays(range.days)} className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold", days === range.days ? "bg-primary text-black" : "text-white/45 hover:text-white")}>{range.label}</button>)}</div>
          <Button variant="outline" size="icon" onClick={() => refetch()} className="size-10 rounded-full border-white/10 bg-white/5" aria-label="Refresh customer analytics"><RefreshCw className={cn("size-4", isFetching && "animate-spin")} /></Button>
          <Button
            variant="outline"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate(customer.status === "active" ? "suspended" : "active")}
            className={cn("border-white/10 bg-white/5", customer.status === "active" ? "text-yellow-400" : "text-green-400")}
          >
            {customer.status === "active" ? "Suspend access" : "Restore access"}
          </Button>
        </div>
      </header>

      <StatsCards stats={stats} />
      <CustomTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mx-0 max-w-full overflow-x-auto" />

      <CustomTabsContent value="overview" activeTab={activeTab} className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="border-b border-white/10 pb-4 text-base font-semibold italic text-primary">Account <span className="text-white">Summary</span></h2>
          <dl className="divide-y divide-white/5 text-sm">
            <div className="flex items-center justify-between gap-4 py-4"><dt className="text-white/40">Activated</dt><dd className="text-right text-white/75">{format(new Date(customer.activated_at), "MMM d, yyyy")}</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="text-white/40">Paid amount</dt><dd className="font-mono text-white/75">${Number(customer.paid_amount).toLocaleString()}</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="text-white/40">Sessions</dt><dd className="font-mono text-white/75">{customer.completed_sessions}/{customer.sessions} completed</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="text-white/40">Renders</dt><dd className="font-mono text-white/75">{customer.completed_renders}/{customer.renders} completed</dd></div>
            <div className="flex items-center justify-between gap-4 py-4"><dt className="text-white/40">Last activity</dt><dd className="text-right text-white/75">{customer.last_activity_at ? formatDistanceToNow(new Date(customer.last_activity_at), { addSuffix: true }) : "Never"}</dd></div>
          </dl>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="border-b border-white/10 pb-4 text-base font-semibold italic text-violet-400">Allowed <span className="text-white">Origins</span></h2>
          <div className="mt-4 space-y-2">
            {customer.allowed_origins.length ? customer.allowed_origins.map((origin) => <div key={origin} className="border-b border-white/5 px-1 py-3 font-mono text-xs text-white/65 last:border-0">{origin}</div>) : <p className="py-10 text-center text-xs text-white/35">No account-level origins configured.</p>}
          </div>
        </section>
      </CustomTabsContent>

      <CustomTabsContent value="keys" activeTab={activeTab}>
        <DataTable columns={keyColumns} data={customer.keys} enableSelection={false} hideColumnToggle emptyMessage="No API keys have been issued." />
      </CustomTabsContent>
      <CustomTabsContent value="users" activeTab={activeTab}>
        <DataTable columns={externalUserColumns} data={data.external_users} filterKey="external_user_id" searchPlaceholder="Search external user ID..." enableSelection={false} hideColumnToggle emptyMessage="No external users in this period." />
      </CustomTabsContent>
      <CustomTabsContent value="activity" activeTab={activeTab}>
        <DataTable columns={activityColumns} data={data.recent_activity} filterKey="external_user_id" searchPlaceholder="Search external user ID..." enableSelection={false} hideColumnToggle emptyMessage="No API requests in this period." />
      </CustomTabsContent>
    </div>
  );
}
