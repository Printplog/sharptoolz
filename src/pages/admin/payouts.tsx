'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Clock,
  CheckCircle,
  XCircle,
  HandCoins,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatAdminDate, formatAdminTime } from '@/lib/utils/adminDate';
import { getApi, postApi } from '@/api/walletApi';
import { StatsCards, type StatData } from '@/components/Admin/Shared/StatsCards';
import {
  DataTable,
  type DataTableControlChangeContext,
} from '@/components/ui/data-table';

type PayoutStatus = 'pending' | 'completed' | 'rejected';

interface PayoutRequest {
  id: string;
  user: { id: number; username: string; email: string };
  amount: number;
  usdt_address: string;
  status: PayoutStatus;
  requestedAt: string;
  updatedAt: string;
}

interface PayoutListResponse {
  results: PayoutRequest[];
  count: number;
  current_page: number;
  total_pages: number;
  stats: {
    pending_count: number;
    pending_amount: number;
    paid_total: number;
    rejected_count: number;
  };
  filters: { status: string; search: string };
}

const PAGE_SIZE = 20;

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PayoutRequest | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery<PayoutListResponse>({
    queryKey: ['admin-payouts', { statusFilter, search, page }],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('page_size', String(PAGE_SIZE));
      if (search) params.set('search', search);
      return getApi(`/admin/payouts/?${params.toString()}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) =>
      postApi('/admin/payouts/approve/', { requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Payout marked as completed');
      closeDialog();
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail?: string }>;
      toast.error(e.response?.data?.detail || 'Failed to approve payout');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { requestId: string; reason: string }) =>
      postApi('/admin/payouts/reject/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      toast.success('Payout rejected');
      closeDialog();
    },
    onError: (err: unknown) => {
      const e = err as AxiosError<{ detail?: string }>;
      toast.error(e.response?.data?.detail || 'Failed to reject payout');
    },
  });

  const closeDialog = () => {
    setShowDialog(false);
    setSelected(null);
    setReason('');
  };

  const openAction = (req: PayoutRequest, type: 'approve' | 'reject') => {
    setSelected(req);
    setAction(type);
    setShowDialog(true);
  };

  const confirmAction = () => {
    if (!selected) return;
    if (action === 'approve') {
      approveMutation.mutate(selected.id);
    } else {
      rejectMutation.mutate({ requestId: selected.id, reason });
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('USDT address copied');
  };

  const stats = data?.stats;
  const rows = data?.results ?? [];

  const formatCurrency = (v: number) =>
    `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const statCards: StatData[] = [
    {
      title: 'Pending Requests',
      value: stats?.pending_count ?? 0,
      label: 'Awaiting admin action',
      icon: Clock,
      gradient: 'from-orange-500/20 to-orange-600/5',
      borderColor: 'border-orange-500/20',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-400',
    },
    {
      title: 'Owed to Users',
      value: formatCurrency(stats?.pending_amount ?? 0),
      label: 'Held referral balance pending payout',
      icon: HandCoins,
      gradient: 'from-amber-500/20 to-amber-600/5',
      borderColor: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-300',
    },
    {
      title: 'Paid Out',
      value: formatCurrency(stats?.paid_total ?? 0),
      label: 'All-time completed payouts',
      icon: CheckCircle,
      gradient: 'from-green-500/20 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
    },
    {
      title: 'Rejected',
      value: stats?.rejected_count ?? 0,
      label: 'All-time rejected requests',
      icon: XCircle,
      gradient: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/20',
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
    },
  ];

  const columns = useMemo<ColumnDef<PayoutRequest>[]>(
    () => [
      {
        accessorKey: 'user.username',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-white">{row.original.user.username}</p>
            <p className="text-xs text-white/40">{row.original.user.email}</p>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <p className="font-bold text-white">
            ${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        ),
      },
      {
        accessorKey: 'usdt_address',
        header: 'USDT Address (BEP20)',
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyAddress(row.original.usdt_address);
            }}
            className="group flex items-center gap-2 text-xs text-white/65 hover:text-white font-mono bg-white/5 rounded-full px-3 py-1.5 border border-white/10"
            title={row.original.usdt_address}
          >
            <span className="max-w-[160px] truncate">{row.original.usdt_address}</span>
            <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          </button>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === 'pending'
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                : row.original.status === 'completed'
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }
          >
            {row.original.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
            {row.original.status === 'completed' && (
              <CheckCircle className="w-3 h-3 mr-1" />
            )}
            {row.original.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'requestedAt',
        header: 'Requested',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm text-white">{formatAdminDate(row.original.requestedAt)}</span>
            <span className="text-[11px] text-white/35">
              {formatAdminTime(row.original.requestedAt)} UTC
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (row.original.status !== 'pending') {
            return <span className="text-xs text-white/30">—</span>;
          }
          return (
            <div className="flex items-center gap-2">
              <PremiumButton
                onClick={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  openAction(row.original, 'approve');
                }}
                text="Mark Paid"
                icon={CheckCircle}
              />
              <PremiumButton
                onClick={(e?: React.MouseEvent) => {
                  e?.stopPropagation();
                  openAction(row.original, 'reject');
                }}
                variant="outline"
                text="Reject"
                icon={XCircle}
                className="border-red-500/30 text-red-400"
              />
            </div>
          );
        },
      },
    ],
    []
  );

  const filters = [
    {
      key: 'status',
      label: 'Status',
      value: statusFilter,
      onChange: (value: string, ctx: DataTableControlChangeContext) => {
        setStatusFilter(value as PayoutStatus | 'all');
        setPage(ctx.nextPage);
      },
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'All', value: 'all' },
      ],
      placeholder: 'Status',
    },
  ];

  return (
    <div className="dashboard-content space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Payout <span className="text-primary">Requests</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">
            Referral earnings withdrawal requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={statCards} isLoading={isLoading && !data} />

      {/* Table */}
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchValue={search}
        onSearchChange={(value, ctx) => {
          setSearch(String(value));
          setPage(ctx.nextPage);
        }}
        searchPlaceholder="Search user, email, or USDT address..."
        filters={filters}
        emptyMessage="No payout requests match the current filters."
        hideColumnToggle
        enableSelection={false}
        pagination={{
          page: data?.current_page ?? page,
          pageSize: PAGE_SIZE,
          totalItems: data?.count ?? 0,
          totalPages: data?.total_pages ?? 1,
          onPageChange: setPage,
        }}
      />

      {/* Confirm Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => (o ? null : closeDialog())}>
        <DialogContent className="p-8">
          <DialogHeader>
            <DialogTitle className="text-white">
              {action === 'approve' ? 'Mark Payout as Paid' : 'Reject Payout Request'}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-white/40 mb-1">User</p>
                  <p className="font-semibold text-white">{selected.user.username}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Amount</p>
                  <p className="font-bold text-green-400">
                    ${selected.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">USDT Address (BEP20)</p>
                  <p className="font-mono text-xs text-white/80 break-all">
                    {selected.usdt_address}
                  </p>
                </div>
              </div>

              {action === 'reject' && (
                <div>
                  <label className="text-sm text-white/40 mb-2 block">
                    Reason (shown internally)
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. invalid address, suspected fraud, duplicate request…"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3 sm:gap-0 mt-6">
            <Button
              variant="outline"
              onClick={closeDialog}
              className="rounded-full px-6 h-11 bg-white/5 border border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <PremiumButton
              onClick={confirmAction}
              text={action === 'approve' ? 'Confirm Paid' : 'Reject Request'}
              icon={action === 'approve' ? CheckCircle : XCircle}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
