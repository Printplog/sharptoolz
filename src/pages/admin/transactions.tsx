'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, Search, Filter, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApi } from '@/api/walletApi';
import { StatsCards, type StatData } from '@/components/Admin/Shared/StatsCards';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  type: 'credit' | 'debit';
  amount: number;
  balanceAfter: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  metadata?: {
    ip?: string;
    method?: string;
    reference?: string;
  };
  createdAt: string;
}

interface TransactionStats {
  total_count: number;
  total_volume: number;
  month_count: number;
  pending_count: number;
}

interface TransactionsResponse {
  transactions: Transaction[];
  stats: TransactionStats;
}

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ['admin-wallet-transactions'],
    queryFn: () => getApi('/admin/wallet/transactions'),
  });

  const transactions = data?.transactions;
  const stats = data?.stats;

  const statsCards: StatData[] = [
    {
      title: 'Total Transactions',
      value: stats?.total_count.toLocaleString() ?? '0',
      label: 'All time',
      icon: Activity,
      gradient: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Total Volume',
      value: `$${stats?.total_volume.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}`,
      label: 'Total deposits',
      icon: DollarSign,
      gradient: 'from-green-500/20 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'This Month',
      value: stats?.month_count.toLocaleString() ?? '0',
      label: 'Recent activity',
      icon: Calendar,
      gradient: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Pending',
      value: stats?.pending_count.toLocaleString() ?? '0',
      label: 'Awaiting processing',
      icon: Clock,
      gradient: 'from-orange-500/20 to-orange-600/5',
      borderColor: 'border-orange-500/20',
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-500',
    },
  ];

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
      <Badge className={styles[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: ColumnDef<Transaction>[] = useMemo(() => [
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-white/70 font-medium">{new Date(row.original.createdAt).toLocaleDateString()}</span>
          <span className="text-[10px] text-white/30 uppercase font-bold tracking-tight">{new Date(row.original.createdAt).toLocaleTimeString()}</span>
        </div>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <p className="font-bold text-white text-sm tracking-tight">{row.original.user.username}</p>
          <p className="text-[11px] text-white/40 font-mono">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            row.original.type === 'credit' ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            {row.original.type === 'credit' ? (
              <ArrowUpRight className="w-3 h-3 text-green-400" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-400" />
            )}
          </div>
          <span className={cn(
            "text-xs font-bold uppercase tracking-widest",
            row.original.type === 'credit' ? 'text-green-400' : 'text-red-400'
          )}>
            {row.original.type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className={cn(
          "font-black text-sm",
          row.original.type === 'credit' ? 'text-green-400' : 'text-red-400'
        )}>
          {row.original.type === 'credit' ? '+' : '-'}${row.original.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="text-[11px] text-white/40 max-w-[200px] truncate italic" title={row.original.description}>
          {row.original.description}
        </p>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right pr-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/40 hover:text-white hover:bg-white/5 h-8 w-8 p-0 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransaction(row.original);
              setShowDetails(true);
            }}
          >
            <Activity className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const filteredTransactions = transactions?.filter((txn: Transaction) => {
    const matchesSearch =
      txn.user.email.toLowerCase().includes(search.toLowerCase()) ||
      txn.user.username.toLowerCase().includes(search.toLowerCase()) ||
      txn.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  return (
    <div className="dashboard-content space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Transaction <span className="text-primary">History</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">Manage all financial activity logs</p>
        </div>
        <Button
          onClick={handleExport}
          className="gap-2 bg-primary text-black px-8 py-6 rounded-2xl font-black hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20"
        >
          <Download className="w-5 h-5" />
          EXPORT LEDGER
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={statsCards} isLoading={isLoading} />

      {/* Transactions Table using DataTable with integrated toolbar */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={filteredTransactions ?? []}
          isLoading={isLoading}
          onRowClick={(txn) => {
            setSelectedTransaction(txn);
            setShowDetails(true);
          }}
          emptyMessage="No transactions found."
          hideColumnToggle
          enableSelection={false}
          className="rounded-3xl border-none shadow-none"
          toolbarActions={() => (
            <div className="flex items-center gap-3 w-full">
              {/* Search Integrated */}
              <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ledger..."
                  className="pl-10 bg-white/3 border-white/5 text-white placeholder:text-white/20 h-10 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/30 transition-all text-sm"
                />
              </div>

              {/* Filters Integrated */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 border-white/5 bg-white/3 text-white/60 hover:bg-white/6 hover:text-white rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    Type: {typeFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121212] border-white/10 rounded-xl p-1.5 min-w-[140px]">
                  {['all', 'credit', 'debit'].map((t) => (
                    <DropdownMenuItem 
                      key={t}
                      onClick={() => setTypeFilter(t as any)} 
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest rounded-lg p-2.5 focus:bg-primary focus:text-black transition-colors",
                        typeFilter === t ? "bg-primary/10 text-primary" : "text-white/60"
                      )}
                    >
                      {t}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 border-white/5 bg-white/3 text-white/60 hover:bg-white/6 hover:text-white rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    Status: {statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121212] border-white/10 rounded-xl p-1.5 min-w-[140px]">
                  {['all', 'completed', 'pending', 'failed'].map((s) => (
                    <DropdownMenuItem 
                      key={s}
                      onClick={() => setStatusFilter(s as any)} 
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest rounded-lg p-2.5 focus:bg-primary focus:text-black transition-colors",
                        statusFilter === s ? "bg-primary/10 text-primary" : "text-white/60"
                      )}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        />
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 max-w-lg rounded-4xl p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tighter">
              Transaction <span className="text-primary ml-1">#Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6 mt-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">ID Ref</p>
                    <p className="font-mono text-primary text-xs font-bold">{selectedTransaction.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Status</p>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>

                <div className="h-px bg-white/10 w-full mb-6" />

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Activity</p>
                    <div className="flex items-center gap-2">
                       {selectedTransaction.type === 'credit' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <p className={cn(
                        "font-bold uppercase tracking-widest text-sm",
                        selectedTransaction.type === 'credit' ? "text-green-400" : "text-red-400"
                      )}>
                        {selectedTransaction.type}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Net Amount</p>
                    <p className={cn(
                      "text-xl font-black italic",
                      selectedTransaction.type === 'credit' ? "text-green-400" : "text-red-400"
                    )}>
                      {selectedTransaction.type === 'credit' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Timestamp</p>
                  <p className="text-white font-bold text-sm">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center justify-between px-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Counterparty</p>
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{selectedTransaction.user.username}</p>
                    <p className="text-[11px] text-white/40 font-mono">{selectedTransaction.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/3 rounded-2xl p-4">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Balance Impact</p>
                   <p className="text-white font-black italic">
                    ${selectedTransaction.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="px-4">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Extended Note</p>
                  <p className="text-white/60 text-sm italic font-medium">"{selectedTransaction.description}"</p>
                </div>
              </div>

              {selectedTransaction.metadata && (
                <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Activity className="w-3 h-3" /> System Evidence
                  </p>
                  <div className="space-y-2">
                    {Object.entries(selectedTransaction.metadata).map(([key, val]) => (
                       <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-white/30 capitalize">{key}</span>
                        <span className="text-white/70 font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
