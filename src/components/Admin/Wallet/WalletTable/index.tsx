import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, CheckCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import type { DataTableControlChangeContext } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatAdminDate, formatAdminTime } from '@/lib/utils/adminDate';

interface UserWallet {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  balance: number;
  status: 'active' | 'blocked';
  createdAt?: string;
  created_at?: string;
}

interface WalletTableProps {
  wallets: UserWallet[];
  search: string;
  balanceFilter: BalanceFilter;
  joinedFilter: JoinedFilter;
  sortBy: SortOption;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onSearchChange: (value: string) => void;
  onBalanceFilterChange: (value: BalanceFilter) => void;
  onJoinedFilterChange: (value: JoinedFilter) => void;
  onSortChange: (value: SortOption) => void;
  onPageChange: (page: number) => void;
  onAdjustBalance: (wallet: UserWallet) => void;
  onViewDetails: (wallet: UserWallet) => void;
  onBlockWallet: (wallet: UserWallet) => void;
}

type BalanceFilter = 'all' | 'positive' | 'zero' | '100plus' | '1000plus';
type JoinedFilter = 'all' | '7' | '30' | '180' | '365';
type SortOption = 'balance-desc' | 'balance-asc' | 'recent' | 'oldest' | 'name';

function getWalletCreatedAt(wallet: UserWallet) {
  return wallet.createdAt || wallet.created_at || '';
}

export default function WalletTable({
  wallets,
  search,
  balanceFilter,
  joinedFilter,
  sortBy,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  onSearchChange,
  onBalanceFilterChange,
  onJoinedFilterChange,
  onSortChange,
  onPageChange,
  onAdjustBalance,
  onViewDetails,
  onBlockWallet,
}: WalletTableProps) {
  const columns = useMemo<ColumnDef<UserWallet>[]>(
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
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => (
          <p className="font-bold text-white">
            ${row.original.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'destructive'}
            className={
              row.original.status === 'active'
                ? 'bg-green-500/20 text-green-500 border-green-500/30'
                : 'bg-red-500/20 text-red-500 border-red-500/30'
            }
          >
            {row.original.status === 'active' ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <Ban className="w-3 h-3 mr-1" />
                Blocked
              </>
            )}
          </Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => {
          const createdAt = getWalletCreatedAt(row.original);
          return (
            <div className="flex flex-col">
              <span className="text-sm text-white">{formatAdminDate(createdAt)}</span>
              <span className="text-[11px] text-white/35">{formatAdminTime(createdAt)} UTC</span>
            </div>
          );
        },
      },
    ],
    [onAdjustBalance, onBlockWallet, onViewDetails]
  );

  const filters = [
    {
      key: 'balance',
      label: 'Balance',
      value: balanceFilter,
      onChange: (value: string, context: DataTableControlChangeContext) => {
        onBalanceFilterChange(value as BalanceFilter);
        onPageChange(context.nextPage);
      },
      options: [
        { label: 'All balances', value: 'all' },
        { label: 'Positive only', value: 'positive' },
        { label: 'Zero balance', value: 'zero' },
        { label: '$100 and above', value: '100plus' },
        { label: '$1,000 and above', value: '1000plus' },
      ],
      placeholder: 'Balance',
    },
    {
      key: 'joined',
      label: 'Joined',
      value: joinedFilter,
      onChange: (value: string, context: DataTableControlChangeContext) => {
        onJoinedFilterChange(value as JoinedFilter);
        onPageChange(context.nextPage);
      },
      options: [
        { label: 'Any join date', value: 'all' },
        { label: 'Last 7 days', value: '7' },
        { label: 'Last 30 days', value: '30' },
        { label: 'Last 6 months', value: '180' },
        { label: 'Last 12 months', value: '365' },
      ],
      placeholder: 'Joined',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={wallets}
      searchValue={search}
      onSearchChange={(value, context: DataTableControlChangeContext) => {
        onSearchChange(String(value));
        onPageChange(context.nextPage);
      }}
      searchPlaceholder="Search by username or email..."
      filters={filters}
      emptyMessage="No wallets match the current filters."
      hideColumnToggle
      enableSelection={false}
      pagination={{
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        onPageChange,
      }}
      toolbarActions={() => (
        <div className="flex items-center gap-3">
          <Select
            value={sortBy}
            onValueChange={(value) => {
              onSortChange(value as SortOption);
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Sort wallets" />
            </SelectTrigger>
            <SelectContent className="bg-[#121212] border-white/10 text-white">
              <SelectItem value="balance-desc">Highest balance</SelectItem>
              <SelectItem value="balance-asc">Lowest balance</SelectItem>
              <SelectItem value="recent">Newest users</SelectItem>
              <SelectItem value="oldest">Oldest users</SelectItem>
              <SelectItem value="name">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}
