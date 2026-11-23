import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock,
  Loader,
  Plus,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteFernwayAccount,
  getFernwayAccounts,
} from "@/api/apiEndpoints";
import { ConfirmAction } from "@/components/ConfirmAction";
import {
  FernwayCardGuilloche,
  FernwayLogo,
  FernwayMark,
} from "@/components/Dashboard/Tools/Fernway/FernwayLogo";
import {
  formatUsd,
  getFernwayTheme,
} from "@/components/Dashboard/Tools/Fernway/themes";
import ToolGridSkeleton from "@/components/ToolGridSkeleton";
import { Button } from "@/components/ui/button";
import { PremiumButton } from "@/components/ui/PremiumButton";

function formatShortDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function OnlineBankingListPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["fernway-accounts"],
    queryFn: getFernwayAccounts,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      setDeletingId(id);
      return deleteFernwayAccount(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      toast.success("Online banking account deleted.");
    },
    onError: () => toast.error("Failed to delete account."),
    onSettled: () => setDeletingId(null),
  });

  const accounts = data?.results ?? [];
  const monthlyPrice = data?.monthly_price ?? 15.0;
  const alertsCount = (data?.expiring_soon_count ?? 0) + (data?.expired_count ?? 0);
  const pendingTransfersTotal = data?.pending_transfers_total ?? 0;

  return (
    <div className="dashboard-content space-y-8 animate-in fade-in duration-700 w-full">
      {/* Header — matches My Documents & All Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tighter italic">
          Online <span className="text-primary">Banking</span>
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/15 text-white/80 hover:text-white hover:bg-white/10"
          >
            <Link to="/documents">
              My Documents
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
          <Button asChild size="sm" className="px-4">
            <Link to="/tools/fernway">
              <Plus className="size-4 mr-1.5" />
              New Account
            </Link>
          </Button>
        </div>
      </div>

      {/* Actionable Alerts Only */}
      {!isLoading && (pendingTransfersTotal > 0 || alertsCount > 0) && (
        <div className="space-y-3">
          {pendingTransfersTotal > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <Clock className="size-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Pending Transfers:</strong> {pendingTransfersTotal} transfer
                  {pendingTransfersTotal === 1 ? " is" : "s are"} awaiting approval.
                </span>
              </div>
            </div>
          )}

          {alertsCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Renewal Reminder:</strong> {alertsCount} account
                  {alertsCount === 1 ? " needs" : "s need"} renewal.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <ToolGridSkeleton />
      ) : isError ? (
        <div className="text-center py-12 border border-red-500/20 rounded-2xl bg-red-500/[0.02] flex flex-col items-center gap-4">
          <p className="text-red-400 text-sm">Failed to load your online banking accounts.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 max-w-xl">
            <div className="size-12 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center shrink-0">
              <FernwayMark className="size-7 text-emerald-400" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-white">No online banking accounts yet</h2>
              <p className="text-sm text-white/55 leading-relaxed">
                Create as many Lindenway accounts as you need. Test each one for free, or activate a
                Live monthly subscription (${monthlyPrice.toFixed(2)}/mo per account) from your crypto
                wallet.
              </p>
            </div>
          </div>
          <PremiumButton
            variant="primary"
            noShadow
            href="/tools/fernway"
            text="Create First Account"
            icon={ArrowRight}
            className="w-full sm:w-auto shrink-0"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const theme = getFernwayTheme();
            const balanceCents = account.accounts?.reduce((sum, a) => sum + (a.balance || 0), 0) ?? 0;
            const card = account.cards?.[0];
            const subStatus = account.subscription_status ?? (account.is_test ? "test" : "active");
            const isLive = Boolean(account.is_live ?? subStatus === "active");
            const isExpired = subStatus === "expired";
            const daysLeft = account.days_remaining ?? 0;
            const pendingCount = account.pending_transfers_count ?? 0;

            return (
              <div
                key={account.id}
                className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col justify-between transition-all hover:border-white/20"
              >
                {/* Branded Card Header (click to manage) */}
                <Link
                  to={`/online-banking/${account.id}`}
                  className="block relative p-5 text-white overflow-hidden"
                  style={{ background: theme.gradient }}
                >
                  <FernwayCardGuilloche className="absolute -right-10 -bottom-12 size-40 text-white/20" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <FernwayLogo
                        markClassName="size-5 text-white"
                        textClassName="text-sm font-bold text-white"
                      />
                      {isLive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/30 border border-white/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          <BadgeCheck className="size-3" />
                          Live · {daysLeft}d left
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 border border-red-400/40 px-2.5 py-0.5 text-[10px] font-semibold text-red-200">
                          <AlertTriangle className="size-3" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/30 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200">
                          Test Mode
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-[11px] text-white/75">Account Balance</div>
                      <div className="text-2xl font-bold tracking-tight tabular-nums">
                        {formatUsd(balanceCents / 100)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                      <span className="truncate pr-2 uppercase">
                        {account.first_name} {account.last_name}
                      </span>
                      <span>•••• {card?.last4 || "8892"}</span>
                    </div>
                  </div>
                </Link>

                {/* Minimal Card Footer — airy single action row matching DocumentCard */}
                <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                  <div className="space-y-1.5">
                    <div className="font-mono text-xs text-white/85 truncate">{account.email}</div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-white/45">
                      <span>
                        {isLive && account.subscription_expires_at
                          ? `Renews ${formatShortDate(account.subscription_expires_at)}`
                          : isExpired
                            ? "Expired — renew inside Manage"
                            : "Free test mode"}
                      </span>

                      {pendingCount > 0 && account.id && (
                        <Link
                          to={`/online-banking/${account.id}?tab=transactions`}
                          className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200 hover:bg-amber-500/20 transition-colors"
                        >
                          <Clock className="size-3 text-amber-400" />
                          {pendingCount} pending
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button asChild className="flex-1 h-11 rounded-full text-xs font-semibold">
                      <Link to={`/online-banking/${account.id}`}>
                        <Settings2 className="size-4 mr-1.5" />
                        Manage Account
                      </Link>
                    </Button>

                    {account.id && (
                      <ConfirmAction
                        trigger={
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={deletingId === account.id}
                            className="size-11 bg-red-500/5 border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white rounded-full shrink-0"
                            aria-label={`Delete ${account.email}`}
                          >
                            {deletingId === account.id ? (
                              <Loader className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        }
                        onConfirm={() => deleteMutation.mutate(account.id!)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
