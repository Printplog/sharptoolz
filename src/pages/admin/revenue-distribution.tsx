import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BadgeDollarSign,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  Gauge,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
} from 'lucide-react';

import { getApi, postApi } from '@/api/walletApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OtpInput } from '@/components/ui/OtpInput';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Switch } from '@/components/ui/switch';
import { StatsCards, type StatData } from '@/components/Admin/Shared/StatsCards';
import { cn } from '@/lib/utils';

type Recipient = {
  id?: string;
  name: string;
  email: string;
  bep20_address: string;
  percentage: string;
};

type DistributionPayout = {
  id: string;
  recipient_name: string;
  recipient_email: string;
  bep20_address: string;
  percentage: string;
  amount: string;
  status: 'pending' | 'submitted' | 'completed' | 'failed';
  provider_transaction_id: string;
  transaction_hash: string;
  error_message: string;
};

type DistributionBatch = {
  id: string;
  amount: string;
  threshold_amount: string;
  balance_before: string;
  status: 'preparing' | 'sending' | 'submitted' | 'completed' | 'failed';
  error_message: string;
  created_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  payouts: DistributionPayout[];
};

type DistributionDashboard = {
  configuration: {
    enabled: boolean;
    threshold_amount: string;
    last_available_balance: string | null;
    last_balance_checked_at: string | null;
    network: 'BEP20';
    currency: 'USDT';
    provider: 'bsc' | 'cpay';
    provider_label: string;
    allocation_total: string;
    deposit_routing_enabled: boolean;
    deposit_provider_configured: boolean;
    live_payouts_enabled: boolean;
    payout_provider_configured: boolean;
  };
  recipients: Recipient[];
  batches: DistributionBatch[];
};

type LiveTreasuryBalance = {
  available_balance: string;
  checked_at: string;
};

type ProtectedAction =
  | { kind: 'save' }
  | { kind: 'run' }
  | { kind: 'retry'; batchId: string };

const RECIPIENT_COLORS = ['#cee88c', '#65d7e8', '#b69cff', '#f4b860', '#f18bbf', '#7fd1a8'];
const BEP20_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const EMPTY_RECIPIENT: Recipient = { name: '', email: '', bep20_address: '', percentage: '' };

const money = (value: string | number | null | undefined) =>
  `${Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDT`;

const shortAddress = (value: string) =>
  value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-7)}` : value;

const statusClass = (status: DistributionBatch['status'] | DistributionPayout['status']) => {
  if (status === 'completed') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
  if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
  if (status === 'submitted' || status === 'sending') return 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300';
  return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
};

export default function RevenueDistributionPage() {
  const queryClient = useQueryClient();
  const hasHydratedForm = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState('100.00');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [protectedAction, setProtectedAction] = useState<ProtectedAction | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingRecipientIndex, setEditingRecipientIndex] = useState<number | null>(null);
  const [recipientDraft, setRecipientDraft] = useState<Recipient>(EMPTY_RECIPIENT);

  const { data, isLoading, isFetching } = useQuery<DistributionDashboard>({
    queryKey: ['revenue-distribution'],
    queryFn: () => getApi('/admin/revenue-distribution/'),
    refetchInterval: 30_000,
  });

  const {
    data: liveTreasury,
    isFetching: isTreasuryFetching,
    refetch: refetchTreasury,
  } = useQuery<LiveTreasuryBalance>({
    queryKey: ['revenue-distribution-live-balance'],
    queryFn: () => postApi('/admin/revenue-distribution/balance/', {}),
    enabled: Boolean(data?.configuration.payout_provider_configured),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });

  useEffect(() => {
    if (!data || hasHydratedForm.current) return;
    setEnabled(data.configuration.enabled);
    setThreshold(data.configuration.threshold_amount);
    setRecipients(data.recipients);
    hasHydratedForm.current = true;
  }, [data]);

  const allocationTotal = useMemo(
    () => recipients.reduce((sum, recipient) => sum + (Number(recipient.percentage) || 0), 0),
    [recipients],
  );
  const availableBalance = Number(
    liveTreasury?.available_balance ?? data?.configuration.last_available_balance ?? 0,
  );
  const thresholdAmount = Math.max(Number(threshold) || 0, 0);
  const distributionReady = thresholdAmount > 0 && availableBalance >= thresholdAmount;
  const allocationReady = Math.abs(allocationTotal - 100) < 0.001;
  const amountUntilTrigger = Math.max(thresholdAmount - availableBalance, 0);
  const completedBatches = data?.batches.filter((batch) => batch.status === 'completed') ?? [];
  const distributedTotal = completedBatches.reduce((sum, batch) => sum + Number(batch.amount || 0), 0);

  const handleTreasuryRefresh = async () => {
    const result = await refetchTreasury();
    const providerLabel = data?.configuration.provider_label ?? 'Payment gateway';
    if (result.error) {
      toast.error(apiError(result.error, `Could not refresh the ${providerLabel} balance.`));
      return;
    }
    if (result.data) toast.success(`${providerLabel} balance synced: ${money(result.data.available_balance)}`);
  };

  const protectedMutation = useMutation({
    mutationFn: async ({ action, code }: { action: ProtectedAction; code: string }) => {
      if (action.kind === 'save') {
        return postApi('/admin/revenue-distribution/configuration/', {
          enabled,
          threshold_amount: threshold,
          recipients,
          two_factor_code: code,
        });
      }
      if (action.kind === 'retry') {
        return postApi(`/admin/revenue-distribution/batches/${action.batchId}/retry/`, {
          two_factor_code: code,
        });
      }
      return postApi('/admin/revenue-distribution/run/', { two_factor_code: code });
    },
    onSuccess: (_, variables) => {
      const message = variables.action.kind === 'save'
        ? 'Revenue distribution configuration saved.'
        : variables.action.kind === 'retry'
          ? 'Failed transfers queued for retry.'
          : 'Distribution check queued.';
      toast.success(message);
      if (variables.action.kind === 'save') hasHydratedForm.current = false;
      closeChallenge();
      queryClient.invalidateQueries({ queryKey: ['revenue-distribution'] });
    },
    onError: (error: unknown) => {
      toast.error(apiError(error, 'The protected action could not be completed.'));
      setTwoFactorCode('');
    },
  });

  const openAddRecipient = () => {
    if (recipients.length >= 20) {
      toast.error('You can configure a maximum of 20 recipients.');
      return;
    }
    setEditingRecipientIndex(null);
    setRecipientDraft(EMPTY_RECIPIENT);
    setRecipientDialogOpen(true);
  };

  const openEditRecipient = (index: number) => {
    setEditingRecipientIndex(index);
    setRecipientDraft({ ...recipients[index] });
    setRecipientDialogOpen(true);
  };

  const saveRecipientDraft = () => {
    const nextRecipient = {
      ...recipientDraft,
      name: recipientDraft.name.trim(),
      email: recipientDraft.email.trim(),
      bep20_address: recipientDraft.bep20_address.trim(),
      percentage: recipientDraft.percentage.trim(),
    };
    if (!nextRecipient.name || !nextRecipient.email || !BEP20_PATTERN.test(nextRecipient.bep20_address)) {
      toast.error('Enter a name, email, and valid BEP20 address.');
      return;
    }
    const share = Number(nextRecipient.percentage);
    if (!(share > 0) || share > 100) {
      toast.error('Share must be greater than 0 and no more than 100.');
      return;
    }
    setRecipients((current) => editingRecipientIndex === null
      ? [...current, nextRecipient]
      : current.map((recipient, index) => index === editingRecipientIndex ? nextRecipient : recipient));
    setRecipientDialogOpen(false);
  };

  const removeRecipient = (index: number) => {
    setRecipients((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const requestSave = () => {
    if (!thresholdAmount) {
      toast.error('Enter a distribution threshold greater than zero.');
      return;
    }
    if (!recipients.length) {
      toast.error('Add at least one revenue recipient.');
      return;
    }
    const incomplete = recipients.some((recipient) =>
      !recipient.name.trim()
      || !recipient.email.trim()
      || !BEP20_PATTERN.test(recipient.bep20_address.trim())
      || !(Number(recipient.percentage) > 0),
    );
    if (incomplete) {
      toast.error('Complete every recipient with a valid BEP20 address and percentage.');
      return;
    }
    if (enabled && !allocationReady) {
      toast.error('Enabled distributions must allocate exactly 100%.');
      return;
    }
    setSettingsDialogOpen(false);
    openChallenge({ kind: 'save' });
  };

  const openChallenge = (action: ProtectedAction) => {
    setTwoFactorCode('');
    setProtectedAction(action);
  };

  const closeChallenge = () => {
    setProtectedAction(null);
    setTwoFactorCode('');
  };

  const confirmProtectedAction = () => {
    if (!protectedAction || twoFactorCode.length !== 6) return;
    protectedMutation.mutate({ action: protectedAction, code: twoFactorCode });
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success('BEP20 address copied.');
    } catch {
      toast.error('The address could not be copied.');
    }
  };

  if (isLoading && !data) {
    return <DistributionSkeleton />;
  }

  const configuration = data?.configuration;
  const providerLabel = configuration?.provider_label ?? 'Payment gateway';
  const providerReady = Boolean(
    configuration?.deposit_routing_enabled
    && configuration.deposit_provider_configured
    && configuration.payout_provider_configured,
  );
  const liveReady = Boolean(providerReady && configuration?.live_payouts_enabled);

  const treasuryStats: StatData[] = [
    {
      title: 'Treasury balance',
      value: money(availableBalance),
      label: liveTreasury?.checked_at || configuration?.last_balance_checked_at
        ? `Checked ${new Date(liveTreasury?.checked_at ?? configuration?.last_balance_checked_at ?? '').toLocaleString()}`
        : `Refresh to read the ${providerLabel} wallet`,
      icon: Landmark,
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-300',
    },
    {
      title: 'Next trigger',
      value: money(thresholdAmount),
      label: distributionReady ? 'Threshold reached — full sweep is ready' : `${money(amountUntilTrigger)} still required`,
      icon: Gauge,
      gradient: 'from-cyan-500/20 to-cyan-600/5',
      borderColor: 'border-cyan-500/20',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-300',
    },
    {
      title: 'Recipients',
      value: recipients.length,
      label: allocationReady ? 'Shares add up to exactly 100%' : `${allocationTotal.toFixed(2)}% currently allocated`,
      icon: UsersRound,
      gradient: 'from-violet-500/20 to-violet-600/5',
      borderColor: 'border-violet-500/20',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-300',
    },
    {
      title: 'Recent distributed',
      value: money(distributedTotal),
      label: `${completedBatches.length} completed ${completedBatches.length === 1 ? 'batch' : 'batches'} in latest activity`,
      icon: BadgeDollarSign,
      gradient: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-300',
    },
  ];

  return (
    <div className="dashboard-content space-y-8 pb-12 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold italic tracking-tighter text-white md:text-4xl">
            Revenue <span className="text-primary">Distribution</span>
          </h1>
          <Badge className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
            USDT · BEP20
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={handleTreasuryRefresh}
            disabled={isTreasuryFetching || !configuration?.payout_provider_configured}
            className="h-11 rounded-full border-white/10 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={cn('mr-2 size-4', isTreasuryFetching && 'animate-spin')} />
            Refresh treasury
          </Button>
          <Button
            onClick={() => setSettingsDialogOpen(true)}
            className="h-11 rounded-full bg-primary px-5 font-bold text-black hover:bg-primary/90"
          >
            <Settings2 className="mr-2 size-4" /> Distribution settings
          </Button>
        </div>
      </header>

      <StatsCards stats={treasuryStats} className="mb-10" />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">Recipients</h2>
            <Badge className="rounded-full border-white/10 bg-white/5 px-3 text-white/50">{recipients.length}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn(
              'h-9 rounded-full border px-4 font-mono',
              allocationReady ? 'border-primary/20 bg-primary/10 text-primary' : 'border-red-400/20 bg-red-400/10 text-red-300',
            )}>
              {allocationTotal.toFixed(2)}%
            </Badge>
            <Button
              variant="outline"
              onClick={openAddRecipient}
              className="h-10 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <Plus className="mr-2 size-4" /> Add recipient
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="hidden grid-cols-[1.1fr_1.15fr_1.35fr_110px_130px_88px] gap-4 border-b border-white/10 bg-white/[0.025] px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30 lg:grid">
            <span>Recipient</span>
            <span>Email</span>
            <span>BEP20 address</span>
            <span>Share</span>
            <span>Next payout</span>
            <span className="text-right">Actions</span>
          </div>

          {!recipients.length ? (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <UsersRound className="size-7 text-white/20" />
              <p className="mt-3 text-sm font-semibold text-white/60">No recipients</p>
              <Button onClick={openAddRecipient} className="mt-4 h-9 rounded-full bg-primary px-4 text-xs font-bold text-black hover:bg-primary/90">
                <Plus className="mr-2 size-3.5" /> Add recipient
              </Button>
            </div>
          ) : recipients.map((recipient, index) => {
            const estimatedPayout = availableBalance * ((Number(recipient.percentage) || 0) / 100);
            return (
              <div key={recipient.id ?? `new-${index}`} className="grid gap-4 border-b border-white/8 px-5 py-5 last:border-0 lg:grid-cols-[1.1fr_1.15fr_1.35fr_110px_130px_88px] lg:items-center lg:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length] }} />
                  <span className="truncate text-sm font-bold text-white">{recipient.name}</span>
                </div>
                <p className="truncate text-xs text-white/50">{recipient.email}</p>
                <button
                  type="button"
                  onClick={() => copyAddress(recipient.bep20_address)}
                  className="flex min-w-0 items-center gap-2 text-left font-mono text-xs text-white/45 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="truncate">{shortAddress(recipient.bep20_address)}</span>
                  <Copy className="size-3 shrink-0" />
                </button>
                <p className="font-mono text-sm font-bold text-primary">{Number(recipient.percentage).toFixed(2)}%</p>
                <p className="font-mono text-xs font-bold text-white/70">{money(estimatedPayout)}</p>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditRecipient(index)}
                    className="size-9 rounded-xl text-white/40 hover:bg-white/10 hover:text-white"
                    aria-label={`Edit ${recipient.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(index)}
                    className="size-9 rounded-xl text-white/30 hover:bg-red-400/10 hover:text-red-300"
                    aria-label={`Remove ${recipient.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-white">Recent distributions</h2>
          <Badge className="rounded-full border-white/10 bg-white/5 px-3 py-1 text-white/50">
            {data?.batches.length ?? 0} total
          </Badge>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          {!data?.batches.length ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <CircleDollarSign className="size-8 text-white/20" />
              <p className="mt-4 font-semibold text-white/70">No distributions yet</p>
            </div>
          ) : data.batches.map((batch) => (
            <div key={batch.id} className="border-b border-white/8 last:border-0">
              <button
                type="button"
                onClick={() => setExpandedBatch((current) => current === batch.id ? null : batch.id)}
                className="grid w-full gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:grid-cols-[1fr_0.8fr_0.8fr_auto_auto] md:items-center md:px-7"
              >
                <div>
                  <p className="font-mono text-xs text-white/35">{batch.id}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{new Date(batch.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Distributed</p>
                  <p className="mt-1 font-mono font-bold text-white">{money(batch.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Recipients</p>
                  <p className="mt-1 text-sm font-semibold text-white">{batch.payouts.length}</p>
                </div>
                <Badge className={cn('w-fit rounded-full border px-3 py-1 capitalize', statusClass(batch.status))}>
                  {batch.status}
                </Badge>
                <ChevronDown className={cn('size-4 text-white/30 transition-transform', expandedBatch === batch.id && 'rotate-180')} />
              </button>
              {expandedBatch === batch.id && (
                <div className="space-y-3 border-t border-white/8 bg-black/15 px-5 py-5 md:px-7">
                  {batch.error_message && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.05] p-3 text-xs text-red-200/75">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {batch.error_message}
                    </div>
                  )}
                  {batch.payouts.map((payout) => (
                    <div key={payout.id} className="grid gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 text-xs md:grid-cols-[1fr_1.2fr_0.6fr_auto] md:items-center">
                      <div>
                        <p className="font-semibold text-white">{payout.recipient_name}</p>
                        <p className="mt-0.5 text-white/35">{payout.recipient_email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyAddress(payout.bep20_address)}
                        className="flex items-center gap-2 font-mono text-white/50 hover:text-white"
                      >
                        {shortAddress(payout.bep20_address)} <Copy className="size-3" />
                      </button>
                      <p className="font-mono font-bold text-white">{money(payout.amount)}</p>
                      <Badge className={cn('w-fit rounded-full border px-2.5 py-1 capitalize', statusClass(payout.status))}>
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                  {batch.status === 'failed' && (
                    <Button
                      variant="outline"
                      onClick={() => openChallenge({ kind: 'retry', batchId: batch.id })}
                      className="rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                    >
                      <RotateCcw className="mr-2 size-4" /> Retry failed transfers
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="border-white/10 bg-[#111214] p-7 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Distribution settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Automatic distribution</p>
                <p className={cn('mt-1 text-xs font-bold', enabled ? 'text-primary' : 'text-white/45')}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable automatic distributions" />
            </div>

            <Field label="Threshold">
              <div className="relative">
                <Input
                  id="distribution-threshold"
                  type="number"
                  min="1"
                  step="0.01"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-black/20 pr-16 font-mono font-bold text-white"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">USDT</span>
              </div>
            </Field>

            <div className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <ReadinessDot
                ready={Boolean(configuration?.deposit_provider_configured)}
                label={configuration?.provider === 'bsc' ? 'Direct deposits' : 'CryptAPI'}
              />
              <ReadinessDot ready={Boolean(configuration?.payout_provider_configured)} label={providerLabel} />
              <ReadinessDot ready={Boolean(configuration?.live_payouts_enabled)} label="Live payouts" />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSettingsDialogOpen(false);
                openChallenge({ kind: 'run' });
              }}
              disabled={!liveReady || !allocationReady || !distributionReady || protectedMutation.isPending}
              className="h-11 rounded-full border-white/10 bg-white/[0.03] font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Send className="mr-2 size-4" /> Distribute now
            </Button>
          </div>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSettingsDialogOpen(false)}
              className="h-11 rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={requestSave}
              className="h-11 rounded-full bg-primary px-6 font-bold text-black hover:bg-primary/90"
            >
              <Save className="mr-2 size-4" /> Save settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={recipientDialogOpen}
        onOpenChange={(open) => {
          setRecipientDialogOpen(open);
          if (!open) setEditingRecipientIndex(null);
        }}
      >
        <DialogContent className="border-white/10 bg-[#111214] p-7 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingRecipientIndex === null ? 'Add recipient' : 'Edit recipient'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Name">
              <Input
                value={recipientDraft.name}
                onChange={(event) => setRecipientDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Recipient name"
                autoFocus
                className="h-11 rounded-xl border-white/10 bg-black/20 text-white"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={recipientDraft.email}
                onChange={(event) => setRecipientDraft((current) => ({ ...current, email: event.target.value }))}
                placeholder="recipient@example.com"
                className="h-11 rounded-xl border-white/10 bg-black/20 text-white"
              />
            </Field>
            <Field
              label="USDT BEP20 address"
              error={recipientDraft.bep20_address && !BEP20_PATTERN.test(recipientDraft.bep20_address.trim())
                ? 'Enter a valid 0x BEP20 address.'
                : undefined}
            >
              <Input
                value={recipientDraft.bep20_address}
                onChange={(event) => setRecipientDraft((current) => ({ ...current, bep20_address: event.target.value }))}
                placeholder="0x..."
                className="h-11 rounded-xl border-white/10 bg-black/20 font-mono text-white"
              />
            </Field>
            <Field label="Share">
              <div className="relative">
                <Input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={recipientDraft.percentage}
                  onChange={(event) => setRecipientDraft((current) => ({ ...current, percentage: event.target.value }))}
                  placeholder="0.00"
                  className="h-11 rounded-xl border-white/10 bg-black/20 pr-10 font-mono font-bold text-white"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">%</span>
              </div>
            </Field>
          </div>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setRecipientDialogOpen(false)}
              className="h-11 rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={saveRecipientDraft}
              className="h-11 rounded-full bg-primary px-6 font-bold text-black hover:bg-primary/90"
            >
              {editingRecipientIndex === null ? <Plus className="mr-2 size-4" /> : <Save className="mr-2 size-4" />}
              {editingRecipientIndex === null ? 'Add recipient' : 'Save recipient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(protectedAction)} onOpenChange={(open) => !open && closeChallenge()}>
        <DialogContent className="border-white/10 bg-[#111214] p-7 sm:max-w-md">
          <DialogHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <DialogTitle className="text-white">Confirm treasury action</DialogTitle>
            <DialogDescription className="leading-6 text-white/45">
              Enter a fresh authenticator code. Each code can authorise this action only once.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Label htmlFor="distribution-two-factor-code" className="mb-3 block text-xs text-white/55">Authenticator code</Label>
            <OtpInput
              id="distribution-two-factor-code"
              value={twoFactorCode}
              onChange={setTwoFactorCode}
              onComplete={() => undefined}
              disabled={protectedMutation.isPending}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-3 sm:gap-2">
            <Button
              variant="outline"
              onClick={closeChallenge}
              className="h-11 rounded-full border-white/10 bg-white/[0.03] px-6 text-white"
            >
              Cancel
            </Button>
            <PremiumButton
              onClick={confirmProtectedAction}
              disabled={twoFactorCode.length !== 6}
              isLoading={protectedMutation.isPending}
              text={protectedAction?.kind === 'save' ? 'Save allocation' : protectedAction?.kind === 'retry' ? 'Retry transfers' : 'Run check'}
              icon={protectedAction?.kind === 'save' ? Save : protectedAction?.kind === 'retry' ? RotateCcw : Send}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isFetching || isTreasuryFetching) && !isLoading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/10 bg-[#111214]/95 px-4 py-2 text-xs text-white/45 shadow-2xl backdrop-blur-xl">
          <RefreshCw className="size-3 animate-spin" /> Refreshing treasury state
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[11px] font-semibold text-white/45">{label}</Label>
      {children}
      {error && <p className="text-[10px] leading-4 text-red-300">{error}</p>}
    </div>
  );
}

function ReadinessDot({ ready, label }: { ready: boolean; label: string }) {
  return (
    <span className="flex items-center gap-2 text-white/45">
      {ready ? <CheckCircle2 className="size-3.5 text-primary" /> : <Clock3 className="size-3.5 text-amber-300" />}
      {label}
    </span>
  );
}

function DistributionSkeleton() {
  return (
    <div className="dashboard-content space-y-8 animate-pulse">
      <div className="h-24 rounded-[2rem] bg-white/[0.04]" />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="h-64 rounded-[2rem] bg-white/[0.04]" />
        <div className="h-64 rounded-[2rem] bg-white/[0.04]" />
      </div>
      <div className="h-48 rounded-[2rem] bg-white/[0.04]" />
    </div>
  );
}

function apiError(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ detail?: string; error?: string }>;
  return axiosError.response?.data?.detail || axiosError.response?.data?.error || fallback;
}
