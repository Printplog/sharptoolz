import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Ban, CheckCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
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
  onAdjustBalance,
  onViewDetails,
  onBlockWallet,
}: WalletTableProps) {
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [joinedFilter, setJoinedFilter] = useState<JoinedFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('balance-desc');

  const filteredWallets = useMemo(() => {
    const now = Date.now();

    const filtered = wallets.filter((wallet) => {
      const createdAt = getWalletCreatedAt(wallet);
      const createdAtMs = createdAt ? new Date(createdAt).getTime() : 0;
      const normalizedSearch = search.trim().toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        wallet.user.email.toLowerCase().includes(normalizedSearch) ||
        wallet.user.username.toLowerCase().includes(normalizedSearch);

      const matchesBalance =
        balanceFilter === 'all' ||
        (balanceFilter === 'positive' && wallet.balance > 0) ||
        (balanceFilter === 'zero' && wallet.balance === 0) ||
        (balanceFilter === '100plus' && wallet.balance >= 100) ||
        (balanceFilter === '1000plus' && wallet.balance >= 1000);

      const matchesJoined =
        joinedFilter === 'all' ||
        (createdAtMs > 0 && createdAtMs >= now - Number(joinedFilter) * 24 * 60 * 60 * 1000);

      return matchesSearch && matchesBalance && matchesJoined;
    });

    return filtered.sort((left, right) => {
      switch (sortBy) {
        case 'balance-asc':
          return left.balance - right.balance;
        case 'recent':
          return new Date(getWalletCreatedAt(right)).getTime() - new Date(getWalletCreatedAt(left)).getTime();
        case 'oldest':
          return new Date(getWalletCreatedAt(left)).getTime() - new Date(getWalletCreatedAt(right)).getTime();
        case 'name':
          return left.user.username.localeCompare(right.user.username);
        case 'balance-desc':
        default:
          return right.balance - left.balance;
      }
    });
  }, [wallets, search, balanceFilter, joinedFilter, sortBy]);

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
      onChange: (value: string) => setBalanceFilter(value as BalanceFilter),
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
      onChange: (value: string) => setJoinedFilter(value as JoinedFilter),
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
      data={filteredWallets}
      searchValue={search}
      onSearchChange={(value) => setSearch(String(value))}
      searchPlaceholder="Search by username or email..."
      filters={filters}
      emptyMessage="No wallets match the current filters."
      hideColumnToggle
      enableSelection={false}
      toolbarActions={() => (
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
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
