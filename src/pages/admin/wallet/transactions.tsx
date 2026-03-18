'use client';

import { useState } from 'react';
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

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Transaction <span className="text-primary">History</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">View all wallet transactions and activity logs</p>
        </div>
        <Button
          onClick={handleExport}
          className="gap-2 bg-primary text-black px-6 py-3 rounded-2xl font-black hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={statsCards} isLoading={isLoading} />

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, description..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10">
                <DollarSign className="w-4 h-4" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={() => setTypeFilter('all')} className="text-white focus:bg-white/10">
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('credit')} className="text-white focus:bg-white/10">
                Credit Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('debit')} className="text-white focus:bg-white/10">
                Debit Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10">
                <Filter className="w-4 h-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border-white/10">
              <DropdownMenuItem onClick={() => setStatusFilter('all')} className="text-white focus:bg-white/10">
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('completed')} className="text-white focus:bg-white/10">
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="text-white focus:bg-white/10">
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('failed')} className="text-white focus:bg-white/10">
                Failed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
        {isLoading ? (
          <div className="p-12">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-32 h-4 bg-white/5 rounded" />
                  <div className="flex-1">
                    <div className="w-40 h-4 bg-white/5 rounded" />
                    <div className="w-32 h-3 bg-white/5 rounded mt-2" />
                  </div>
                  <div className="w-20 h-4 bg-white/5 rounded" />
                  <div className="w-24 h-4 bg-white/5 rounded" />
                  <div className="w-16 h-6 bg-white/5 rounded" />
                  <div className="w-24 h-4 bg-white/5 rounded" />
                  <div className="w-12 h-8 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredTransactions && filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedTransaction(txn);
                      setShowDetails(true);
                    }}
                  >
                    <td className="py-4 px-6 text-xs text-white/40">
                      {new Date(txn.createdAt).toLocaleDateString()}
                      <span className="text-xs text-white/30 ml-2">
                        {new Date(txn.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-semibold text-white">{txn.user.username}</p>
                        <p className="text-xs text-white/40">{txn.user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {txn.type === 'credit' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                        )}
                        <span className={txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                          {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`font-bold ${txn.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {txn.type === 'credit' ? '+' : '-'}$
                        {txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(txn.status)}</td>
                    <td className="py-4 px-6 text-xs text-white/40 max-w-xs truncate">
                      {txn.description}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/40 hover:text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTransaction(txn);
                          setShowDetails(true);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-white/40">No transactions found</div>
        )}
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Transaction ID</p>
                  <p className="font-mono text-white text-xs">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Date & Time</p>
                  <p className="text-white">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">User</p>
                  <p className="font-semibold text-white">{selectedTransaction.user.username}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">Email</p>
                  <p className="text-white">{selectedTransaction.user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-xs text-white/40 mb-1">Type</p>
                  <div className="flex items-center gap-2">
                    {selectedTransaction.type === 'credit' ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                    <span className={selectedTransaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                      {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-xs text-white/40 mb-1">Amount</p>
                  <p className={`font-bold ${selectedTransaction.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedTransaction.type === 'credit' ? '+' : '-'}$
                    {selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-xs text-white/40 mb-1">Balance After</p>
                <p className="font-bold text-white">
                  ${selectedTransaction.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/40 mb-1">Description</p>
                <p className="text-white">{selectedTransaction.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">Status</p>
                {getStatusBadge(selectedTransaction.status)}
              </div>

              {selectedTransaction.metadata && (
                <div className="bg-white/5 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-bold text-white/40">Metadata</p>
                  {selectedTransaction.metadata.ip && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/40">IP Address</p>
                      <p className="text-white font-mono text-xs">{selectedTransaction.metadata.ip}</p>
                    </div>
                  )}
                  {selectedTransaction.metadata.method && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/40">Method</p>
                      <p className="text-white">{selectedTransaction.metadata.method}</p>
                    </div>
                  )}
                  {selectedTransaction.metadata.reference && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-white/40">Reference</p>
                      <p className="text-white font-mono text-xs">{selectedTransaction.metadata.reference}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
