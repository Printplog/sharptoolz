import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Landmark,
  Loader,
  RefreshCw,
  Settings2,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteAdminFernwayAccount,
  getAdminFernwayAccounts,
  updateAdminFernwaySettings,
  updateAdminFernwaySubscription,
  type FernwayProfile,
} from "@/api/apiEndpoints";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import { ConfirmAction } from "@/components/ConfirmAction";
import { FernwayMark } from "@/components/Dashboard/Tools/Fernway/FernwayLogo";
import {
  formatUsd,
  useFernwayAppBaseUrl,
} from "@/components/Dashboard/Tools/Fernway/themes";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  type DataTableFilter,
} from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "test" | "expired" | "pending_transfers";

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminOnlineBankingPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [siteUrlDraft, setSiteUrlDraft] = useState("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-fernway-accounts", { search, status: statusFilter }],
    queryFn: () =>
      getAdminFernwayAccounts({
        search: search || undefined,
        status: statusFilter,
      }),
    staleTime: 20 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
  });

  const subMutation = useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "activate" | "extend" | "set_test" | "expire";
    }) => {
      setBusyId(id);
      return updateAdminFernwaySubscription(id, action, 30);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      const msg: Record<typeof vars.action, string> = {
        activate: "Activated Live Mode for 30 days.",
        extend: "Extended Live subscription by +30 days.",
        set_test: "Switched account to Test Mode.",
        expire: "Marked subscription expired.",
      };
      toast.success(msg[vars.action]);
    },
    onError: () => toast.error("Failed to update subscription status."),
    onSettled: () => setBusyId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return deleteAdminFernwayAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      toast.success("Online banking account deleted.");
    },
    onError: () => toast.error("Failed to delete online banking account."),
    onSettled: () => setDeletingId(null),
  });

  const saveSiteUrlMutation = useMutation({
    mutationFn: (url: string) => updateAdminFernwaySettings(url),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      setSiteDialogOpen(false);
      toast.success(
        res.online_banking_url
          ? `Banking website updated to ${res.online_banking_url}`
          : "Banking website reset to default.",
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to save banking website URL.";
      toast.error(msg);
    },
  });

  const accounts = data?.results ?? [];
  const stats = data?.stats;
  const fernwayBase = useFernwayAppBaseUrl(data?.online_banking_url);

  const openSiteSettings = () => {
    setSiteUrlDraft(data?.online_banking_url ?? "");
    setSiteDialogOpen(true);
  };

  const statsCards: StatData[] = [
    {
      title: "Total Banking Accounts",
      value: (stats?.total_accounts ?? 0).toLocaleString(),
      label: "Created across all users",
      icon: Landmark,
      gradient: "from-blue-500/20 to-blue-600/5",
      borderColor: "border-blue-500/20",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    {
      title: "Live Subscriptions",
      value: (stats?.live_accounts ?? 0).toLocaleString(),
      label: `$${((stats?.live_accounts ?? 0) * (data?.monthly_price ?? 15)).toFixed(2)}/mo active`,
      icon: BadgeCheck,
      gradient: "from-green-500/20 to-green-600/5",
      borderColor: "border-green-500/20",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-400",
    },
    {
      title: "Test / Expired",
      value: ((stats?.test_accounts ?? 0) + (stats?.expired_accounts ?? 0)).toLocaleString(),
      label: `${stats?.test_accounts ?? 0} test · ${stats?.expired_accounts ?? 0} expired`,
      icon: AlertTriangle,
      gradient: "from-orange-500/20 to-orange-600/5",
      borderColor: "border-orange-500/20",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-400",
    },
    {
      title: "Pending Transfers",
      value: (stats?.pending_transfers_total ?? 0).toLocaleString(),
      label: "Awaiting payout approval",
      icon: Clock,
      gradient: "from-amber-500/20 to-amber-600/5",
      borderColor: "border-amber-500/20",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
    },
  ];

  const handleCopyLogin = useCallback((account: FernwayProfile) => {
    navigator.clipboard.writeText(
      `Email: ${account.email}\nPassword: ${account.password}\nTransaction PIN: ${account.transaction_pin || "1234"}`,
    );
    toast.success(`Copied login & PIN for ${account.email}`);
  }, []);

  const columns = useMemo<ColumnDef<FernwayProfile>[]>(
    () => [
      {
        id: "account",
        header: "Banking Account",
        cell: ({ row }) => {
          const account = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FernwayMark className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-semibold text-sm truncate max-w-[180px]">
                    {account.first_name} {account.last_name}
                  </p>
                  {account.email_verified && (
                    <span title="Verified email">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-mono text-primary">
                  <span className="truncate max-w-[190px]">{account.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyLogin(account)}
                    className="text-white/40 hover:text-white cursor-pointer shrink-0"
                    title="Copy login email, password & PIN"
                    aria-label={`Copy credentials for ${account.email}`}
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
                <p className="text-[11px] text-white/35 mt-0.5">
                  PIN: <span className="font-mono text-white/60">{account.transaction_pin || "1234"}</span> · •••• {account.cards?.[0]?.last4 || "8892"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "owner",
        header: "SharpToolz Owner",
        cell: ({ row }) => {
          const owner = row.original.owner;
          if (!owner) {
            return <span className="text-white/25 text-sm italic">—</span>;
          }
          return (
            <Link to={`/admin/users/${owner.id}`} className="inline-flex items-center gap-2 group">
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/50 group-hover:text-primary transition-colors">
                <UserIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium group-hover:text-primary transition-colors truncate max-w-[140px]">
                  {owner.username}
                </p>
                <p className="text-white/35 text-[11px] truncate max-w-[170px]">{owner.email}</p>
              </div>
            </Link>
          );
        },
      },
      {
        id: "balance",
        header: "Balance",
        cell: ({ row }) => {
          const balanceCents =
            row.original.accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
          return (
            <span className="font-mono font-semibold text-sm text-white tabular-nums">
              {formatUsd(balanceCents / 100)}
            </span>
          );
        },
      },
      {
        id: "subscription",
        header: "Subscription",
        cell: ({ row }) => {
          const account = row.original;
          const subStatus = account.subscription_status ?? (account.is_test ? "test" : "active");
          const isLive = Boolean(account.is_live ?? subStatus === "active");
          const isExpired = subStatus === "expired";

          return (
            <div className="space-y-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border w-fit",
                  isLive
                    ? "bg-green-500/10 text-green-400 border-green-500/25"
                    : isExpired
                      ? "bg-red-500/10 text-red-400 border-red-500/25"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/25",
                )}
              >
                {isLive ? (
                  <BadgeCheck className="h-3 w-3" />
                ) : isExpired ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : null}
                {isLive
                  ? `Live · ${account.days_remaining ?? 0}d left`
                  : isExpired
                    ? "Expired"
                    : "Test Mode"}
              </span>
              {account.subscription_expires_at && (
                <p className="text-[11px] text-white/40">
                  Ends {formatShortDate(account.subscription_expires_at)}
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "transfers",
        header: "Transfers",
        cell: ({ row }) => {
          const account = row.original;
          const pendingCount = account.pending_transfers_count ?? 0;
          if (pendingCount > 0 && account.id) {
            return (
              <Link
                to={`/admin/online-banking/${account.id}?tab=transactions`}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <Clock className="size-3 text-amber-400" />
                {pendingCount} pending
              </Link>
            );
          }
          return <span className="text-xs text-white/35">None pending</span>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const account = row.original;
          const subStatus = account.subscription_status ?? (account.is_test ? "test" : "active");
          const isLive = Boolean(account.is_live ?? subStatus === "active");
          const isBusy = busyId === account.id && subMutation.isPending;
          const isDeleting = deletingId === account.id && deleteMutation.isPending;
          const fernwayUrl = `${fernwayBase}/overview?token=${encodeURIComponent(account.auth_token || "")}`;

          return (
            <div className="flex items-center gap-1.5">
              {account.id && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Link to={`/admin/online-banking/${account.id}`}>
                    <Settings2 className="size-3.5 mr-1.5" />
                    Manage
                  </Link>
                </Button>
              )}

              {account.id && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() =>
                    subMutation.mutate({
                      id: account.id!,
                      action: isLive ? "extend" : "activate",
                    })
                  }
                  className="h-8 px-3 text-xs bg-primary/10 border-primary/25 text-primary hover:bg-primary hover:text-black"
                  title={isLive ? "Extend Live by +30 days (free)" : "Activate Live 30d (free)"}
                >
                  {isBusy ? (
                    <Loader className="size-3.5 animate-spin" />
                  ) : isLive ? (
                    <>
                      <RefreshCw className="size-3 mr-1" />
                      +30d
                    </>
                  ) : (
                    "Go Live"
                  )}
                </Button>
              )}

              <Button
                asChild
                size="icon"
                variant="outline"
                className="h-8 w-8 rounded-full bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                title="Open in Fernway"
              >
                <a href={fernwayUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>

              {account.id && (
                <ConfirmAction
                  title="Delete Online Banking Account"
                  description={`Permanently delete ${account.email} (${account.first_name} ${account.last_name}) and all its transactions?`}
                  onConfirm={() => deleteMutation.mutate(account.id!)}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isDeleting}
                      className="h-8 w-8 rounded-full border-red-500/20 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30"
                      aria-label={`Delete ${account.email}`}
                    >
                      {isDeleting ? (
                        <Loader className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  }
                />
              )}
            </div>
          );
        },
      },
    ],
    [busyId, deletingId, deleteMutation, fernwayBase, handleCopyLogin, subMutation],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        key: "status",
        label: "Status",
        value: statusFilter,
        onChange: (value: string) => {
          setStatusFilter(value as StatusFilter);
        },
        options: [
          { label: "All statuses", value: "all" },
          { label: "Live", value: "active" },
          { label: "Test Mode", value: "test" },
          { label: "Expired", value: "expired" },
          { label: "Pending Transfers", value: "pending_transfers" },
        ],
        placeholder: "Status",
      },
    ],
    [statusFilter],
  );

  return (
    <div className="dashboard-content space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0">
            <FernwayMark className="size-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tighter italic">
              Online <span className="text-primary">Banking</span>
            </h1>
            <p className="text-sm text-white/45 mt-0.5">
              View and manage every user&apos;s Fernway account, subscription status, balances, PINs, and pending transfers.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openSiteSettings}
            className="bg-white/5 border-white/10 text-white/85 hover:text-white hover:bg-white/10 w-fit"
          >
            <Globe className="size-3.5 mr-1.5 text-emerald-400" />
            Banking Website
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 w-fit"
          >
            <Link to="/admin/tools">Edit Pricing &amp; Visibility</Link>
          </Button>
        </div>
      </div>

      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent className="border-white/10 bg-[#0d1117] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Globe className="size-4 text-emerald-400" />
              Online Banking Website
            </DialogTitle>
            <DialogDescription className="text-white/55">
              Set the live Fernway banking web app URL used for all previews, customer sign-in links, and Open App buttons. Change it here anytime when you switch domains.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4 py-1"
            onSubmit={(e) => {
              e.preventDefault();
              saveSiteUrlMutation.mutate(siteUrlDraft.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="online-banking-url" className="text-xs text-white/75">
                Banking Website URL
              </Label>
              <Input
                id="online-banking-url"
                type="url"
                value={siteUrlDraft}
                onChange={(e) => setSiteUrlDraft(e.target.value)}
                placeholder="https://fernway.sharptoolz.com"
                className="bg-white/5 border-white/15 text-white font-mono text-sm placeholder:text-white/30"
              />
              <p className="text-[11px] text-white/45">
                Currently active:{" "}
                <a
                  href={fernwayBase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-400 hover:underline"
                >
                  {fernwayBase}
                </a>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSiteDialogOpen(false)}
                className="border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveSiteUrlMutation.isPending}>
                {saveSiteUrlMutation.isPending ? (
                  <>
                    <Loader className="size-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Website URL"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StatsCards stats={statsCards} isLoading={isLoading} />

      {isError ? (
        <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-10 text-center space-y-3">
          <p className="text-sm text-red-400">Failed to load online banking accounts.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={(value) => setSearch(String(value))}
          searchPlaceholder="Search by account holder, Fernway email, or owner..."
          filters={filters}
          emptyMessage="No online banking accounts found."
          hideColumnToggle
          enableSelection={false}
        />
      )}
    </div>
  );
}
