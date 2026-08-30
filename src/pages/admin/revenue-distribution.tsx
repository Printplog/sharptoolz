import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  WalletCards,
} from 'lucide-react';

import { getApi, postApi } from '@/api/walletApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    allocation_total: string;
    deposit_routing_enabled: boolean;
    deposit_provider_configured: boolean;
    live_payouts_enabled: boolean;
    payout_provider_configured: boolean;
  };
  recipients: Recipient[];
  batches: DistributionBatch[];
};

type ProtectedAction =
  | { kind: 'save' }
  | { kind: 'run' }
  | { kind: 'retry'; batchId: string };

const RECIPIENT_COLORS = ['#cee88c', '#65d7e8', '#b69cff', '#f4b860', '#f18bbf', '#7fd1a8'];
const BEP20_PATTERN = /^0x[a-fA-F0-9]{40}$/;

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

  const { data, isLoading, isFetching } = useQuery<DistributionDashboard>({
    queryKey: ['cpay-distribution'],
    queryFn: () => getApi('/admin/cpay-distribution/'),
    refetchInterval: 30_000,
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
  const availableBalance = Number(data?.configuration.last_available_balance ?? 0);
  const thresholdAmount = Math.max(Number(threshold) || 0, 0);
  const distributionReady = thresholdAmount > 0 && availableBalance >= thresholdAmount;
  const progress = thresholdAmount > 0 ? Math.min((availableBalance / thresholdAmount) * 100, 100) : 0;
  const allocationReady = Math.abs(allocationTotal - 100) < 0.001;

  const refreshBalance = useMutation({
    mutationFn: () => postApi<{ available_balance: string }>('/admin/cpay-distribution/balance/', {}),
    onSuccess: (result) => {
      toast.success(`CPay balance refreshed: ${money(result.available_balance)}`);
      queryClient.invalidateQueries({ queryKey: ['cpay-distribution'] });
    },
    onError: (error: unknown) => toast.error(apiError(error, 'Could not refresh the CPay balance.')),
  });

  const protectedMutation = useMutation({
    mutationFn: async ({ action, code }: { action: ProtectedAction; code: string }) => {
      if (action.kind === 'save') {
        return postApi('/admin/cpay-distribution/configuration/', {
          enabled,
          threshold_amount: threshold,
          recipients,
          two_factor_code: code,
        });
      }
      if (action.kind === 'retry') {
        return postApi(`/admin/cpay-distribution/batches/${action.batchId}/retry/`, {
          two_factor_code: code,
        });
      }
      return postApi('/admin/cpay-distribution/run/', { two_factor_code: code });
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
      queryClient.invalidateQueries({ queryKey: ['cpay-distribution'] });
    },
    onError: (error: unknown) => {
      toast.error(apiError(error, 'The protected action could not be completed.'));
      setTwoFactorCode('');
    },
  });

  const addRecipient = () => {
    if (recipients.length >= 20) {
      toast.error('CPay supports a maximum of 20 configured recipients here.');
      return;
    }
    setRecipients((current) => [
      ...current,
      { name: '', email: '', bep20_address: '', percentage: '' },
    ]);
  };

  const updateRecipient = (index: number, field: keyof Recipient, value: string) => {
    setRecipients((current) => current.map((recipient, currentIndex) =>
      currentIndex === index ? { ...recipient, [field]: value } : recipient,
    ));
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
  const providerReady = Boolean(
    configuration?.deposit_routing_enabled
    && configuration.deposit_provider_configured
    && configuration.payout_provider_configured,
  );
  const liveReady = Boolean(providerReady && configuration?.live_payouts_enabled);

  return (
    <div className="dashboard-content space-y-8 pb-12">
      <header className="flex flex-col gap-6 border-b border-white/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary/80">
            <Network className="size-3.5" />
            USDT · BNB Smart Chain
          </div>
          <h1 className="text-3xl font-bold italic tracking-tighter text-white md:text-4xl">
            Revenue <span className="text-primary">Distribution</span>
          </h1>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Route fast CryptAPI deposits into the CPay treasury, then split the full available balance across verified BEP20 recipients once the threshold is reached.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refreshBalance.mutate()}
            disabled={refreshBalance.isPending || !configuration?.payout_provider_configured}
            className="h-11 rounded-full border-white/10 bg-white/[0.03] px-5 text-white hover:bg-white/[0.08]"
          >
            <RefreshCw className={cn('mr-2 size-4', refreshBalance.isPending && 'animate-spin')} />
            Check balance
          </Button>
          <PremiumButton onClick={requestSave} text="Save allocation" icon={Save} />
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-[#0e0f11] py-0">
          <CardContent className="p-0">
            <div className="grid gap-8 p-7 md:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">Available treasury</p>
                    <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">
                      {money(availableBalance).replace(' USDT', '')}
                      <span className="ml-2 text-sm font-bold tracking-normal text-primary">USDT</span>
                    </p>
                  </div>
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                    <WalletCards className="size-6 text-primary" />
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
                  <span>{money(availableBalance)} available</span>
                  <span>Trigger at {money(thresholdAmount)}</span>
                </div>
              </div>

              <div className="min-w-40 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Ready now</p>
                <p className="mt-2 text-3xl font-black text-primary">{distributionReady ? 'Yes' : 'No'}</p>
                <p className="mt-1 text-xs text-white/45">
                  {distributionReady ? 'Full balance will be distributed' : 'Waiting for the threshold'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/8 bg-white/[0.02] px-7 py-4 text-xs md:px-9">
              <ReadinessDot ready={Boolean(configuration?.deposit_provider_configured)} label="Bridge credentials" />
              <ReadinessDot ready={Boolean(configuration?.deposit_routing_enabled)} label="CryptAPI → CPay routing" />
              <ReadinessDot ready={Boolean(configuration?.live_payouts_enabled)} label="Live payout gate" />
              {configuration?.last_balance_checked_at && (
                <span className="ml-auto text-white/30">
                  Checked {new Date(configuration.last_balance_checked_at).toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-white/[0.035]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Automation</p>
                <CardTitle className="mt-2 text-xl text-white">Threshold policy</CardTitle>
              </div>
              <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enable automatic distributions" />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="distribution-threshold" className="text-xs text-white/55">Trigger distribution at</Label>
              <div className="relative">
                <Input
                  id="distribution-threshold"
                  type="number"
                  min="1"
                  step="0.01"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-black/20 pr-16 font-mono text-white"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">USDT</span>
              </div>
            </div>
            <div className={cn(
              'rounded-2xl border p-4 text-xs leading-5',
              enabled && liveReady
                ? 'border-primary/20 bg-primary/[0.06] text-white/60'
                : 'border-amber-400/15 bg-amber-400/[0.05] text-amber-100/65',
            )}>
              {enabled && liveReady
                ? 'Automatic distribution is ready after this allocation is saved with your authenticator code.'
                : 'Configuration can be saved safely, but funds will not move until the server payout gate and CPay wallet credentials are enabled.'}
            </div>
            <Button
              onClick={() => openChallenge({ kind: 'run' })}
              disabled={!liveReady || !allocationReady || protectedMutation.isPending}
              className="h-11 w-full rounded-full bg-white text-black hover:bg-primary"
            >
              <Send className="mr-2 size-4" />
              Run distribution check
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">Allocation map</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Who receives the available balance</h2>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn(
              'h-8 rounded-full border px-4 font-mono',
              allocationReady
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-red-400/20 bg-red-400/10 text-red-300',
            )}>
              {allocationTotal.toFixed(2)}% allocated
            </Badge>
            <Button
              variant="outline"
              onClick={addRecipient}
              className="h-10 rounded-full border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
            >
              <Plus className="mr-2 size-4" /> Add person
            </Button>
          </div>
        </div>

        <AllocationRail recipients={recipients} total={allocationTotal} />

        <div className="grid gap-4">
          {recipients.map((recipient, index) => {
            const addressValid = !recipient.bep20_address || BEP20_PATTERN.test(recipient.bep20_address);
            return (
              <Card key={recipient.id ?? `new-${index}`} className="rounded-[1.6rem] border-white/10 bg-white/[0.025]">
                <CardContent className="grid gap-5 p-5 lg:grid-cols-[44px_1fr_1.1fr_1.55fr_120px_44px] lg:items-end">
                  <div
                    className="flex size-11 items-center justify-center rounded-2xl text-sm font-black text-black"
                    style={{ backgroundColor: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length] }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <Field label="Name">
                    <Input
                      value={recipient.name}
                      onChange={(event) => updateRecipient(index, 'name', event.target.value)}
                      placeholder="Recipient name"
                      className="h-11 rounded-xl border-white/10 bg-black/20 text-white"
                    />
                  </Field>
                  <Field label="Payout email">
                    <Input
                      type="email"
                      value={recipient.email}
                      onChange={(event) => updateRecipient(index, 'email', event.target.value)}
                      placeholder="name@example.com"
                      className="h-11 rounded-xl border-white/10 bg-black/20 text-white"
                    />
                  </Field>
                  <Field label="USDT BEP20 address" error={!addressValid ? 'Address must be 0x plus 40 hexadecimal characters.' : undefined}>
                    <div className="relative">
                      <Input
                        value={recipient.bep20_address}
                        onChange={(event) => updateRecipient(index, 'bep20_address', event.target.value.trim())}
                        placeholder="0x…"
                        className={cn(
                          'h-11 rounded-xl border-white/10 bg-black/20 pr-10 font-mono text-xs text-white',
                          !addressValid && 'border-red-400/40',
                        )}
                      />
                      {recipient.bep20_address && addressValid && (
                        <button
                          type="button"
                          onClick={() => copyAddress(recipient.bep20_address)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white"
                          aria-label={`Copy ${recipient.name || 'recipient'} address`}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </Field>
                  <Field label="Share">
                    <div className="relative">
                      <Input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={recipient.percentage}
                        onChange={(event) => updateRecipient(index, 'percentage', event.target.value)}
                        className="h-11 rounded-xl border-white/10 bg-black/20 pr-9 font-mono text-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">%</span>
                    </div>
                  </Field>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(index)}
                    className="size-11 rounded-xl text-white/30 hover:bg-red-400/10 hover:text-red-300"
                    aria-label={`Remove ${recipient.name || 'recipient'}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35">Settlement ledger</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Recent distributions</h2>
        </div>
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.02]">
          {!data?.batches.length ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <CircleDollarSign className="size-8 text-white/20" />
              <p className="mt-4 font-semibold text-white/70">No distribution batches yet</p>
              <p className="mt-1 max-w-md text-sm text-white/35">The first batch will appear after the CPay balance reaches the saved threshold.</p>
            </div>
          ) : data.batches.map((batch) => (
            <div key={batch.id} className="border-b border-white/8 last:border-0">
              <button
                type="button"
                onClick={() => setExpandedBatch((current) => current === batch.id ? null : batch.id)}
                className="grid w-full gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.025] md:grid-cols-[1fr_0.8fr_0.8fr_auto] md:items-center md:px-7"
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

      {isFetching && !isLoading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-white/10 bg-[#111214]/95 px-4 py-2 text-xs text-white/45 shadow-2xl backdrop-blur-xl">
          <RefreshCw className="size-3 animate-spin" /> Refreshing treasury state
        </div>
      )}
    </div>
  );
}

function AllocationRail({ recipients, total }: { recipients: Recipient[]; total: number }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
      <div className="flex h-4 overflow-hidden rounded-full bg-white/[0.04]">
        {recipients.map((recipient, index) => (
          <div
            key={recipient.id ?? index}
            className="h-full border-r border-black/25 transition-[width] duration-500 last:border-0"
            style={{
              width: `${Math.max(0, Math.min(Number(recipient.percentage) || 0, 100))}%`,
              backgroundColor: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length],
            }}
            title={`${recipient.name || `Recipient ${index + 1}`}: ${recipient.percentage || 0}%`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {recipients.map((recipient, index) => (
          <div key={recipient.id ?? index} className="flex items-center gap-2 text-xs text-white/45">
            <span className="size-2 rounded-full" style={{ backgroundColor: RECIPIENT_COLORS[index % RECIPIENT_COLORS.length] }} />
            <span>{recipient.name || `Recipient ${index + 1}`}</span>
            <span className="font-mono text-white/70">{Number(recipient.percentage || 0).toFixed(2)}%</span>
          </div>
        ))}
        {!recipients.length && <span className="text-xs text-white/30">Add a recipient to begin mapping the split.</span>}
        {total > 100 && <span className="ml-auto text-xs font-semibold text-red-300">Allocation exceeds 100%</span>}
      </div>
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
