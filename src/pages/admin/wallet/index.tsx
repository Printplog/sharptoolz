'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import WalletStats from '@/components/Admin/Wallet/Stats/WalletStats';
import WalletTable from '@/components/Admin/Wallet/WalletTable';
import PendingRequests from '@/components/Admin/Wallet/PendingRequests';
import AdjustBalanceDialog from '@/components/Admin/Wallet/Modals/AdjustBalanceDialog';
import { getApi, postApi } from '@/api/walletApi';

// Backend endpoints (no /api/ prefix - apiClient handles baseURL)
const API_BASE = '/admin';

interface UserWallet {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  balance: number;
  status: 'active' | 'blocked';
  createdAt: string;
}

interface FundingRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  amount: number;
  proofUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

interface WalletStats {
  totalBalance: number;
  pendingFunds: number;
  monthCredit: number;
  monthDebit: number;
}

export default function WalletManagementPage() {
  const queryClient = useQueryClient();
  const [selectedWallet, setSelectedWallet] = useState<UserWallet | null>(null);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);

  // Fetch wallet stats
  const { data: stats, isLoading: statsLoading } = useQuery<WalletStats>({
    queryKey: ['admin-wallet-stats'],
    queryFn: () => getApi(`${API_BASE}/wallet/stats`),
  });

  // Fetch user wallets
  const { data: wallets, isLoading: walletsLoading } = useQuery<UserWallet[]>({
    queryKey: ['admin-wallets'],
    queryFn: () => getApi(`${API_BASE}/wallet`),
  });

  // Fetch pending requests
  const { data: requests, isLoading: requestsLoading } = useQuery<FundingRequest[]>({
    queryKey: ['admin-wallet-pending'],
    queryFn: () => getApi(`${API_BASE}/wallet/pending`),
  });

  // Adjust balance mutation
  const adjustBalanceMutation = useMutation({
    mutationFn: (data: { walletId: string; type: string; amount: number; reason: string }) =>
      postApi(`${API_BASE}/wallet/adjust`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-stats'] });
      toast.success('Balance adjusted successfully');
      setShowAdjustDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to adjust balance');
    },
  });

  // Approve request mutation
  const approveRequestMutation = useMutation({
    mutationFn: (data: { requestId: string; notes?: string }) =>
      postApi(`${API_BASE}/wallet/approve`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-stats'] });
      toast.success('Funding request approved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (data: { requestId: string; notes?: string }) =>
      postApi(`${API_BASE}/wallet/reject`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-pending'] });
      toast.success('Funding request rejected');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const handleAdjustBalance = (wallet: UserWallet) => {
    setSelectedWallet(wallet);
    setShowAdjustDialog(true);
  };

  const handleViewDetails = (wallet: UserWallet) => {
    // TODO: Open wallet details dialog
  };

  const handleBlockWallet = (wallet: UserWallet) => {
    // TODO: Implement block/unblock wallet
  };

  const handleApproveRequest = (requestId: string, notes?: string) => {
    approveRequestMutation.mutate({ requestId, notes });
  };

  const handleRejectRequest = (requestId: string, notes?: string) => {
    rejectRequestMutation.mutate({ requestId, notes });
  };

  const handleSubmitAdjustment = (
    walletId: string,
    type: 'credit' | 'debit',
    amount: number,
    reason: string
  ) => {
    adjustBalanceMutation.mutate({ walletId, type, amount, reason });
  };

  return (
    <div className="dashboard-content space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Wallet <span className="text-primary">Management</span>
          </h1>
          <p className="text-white/40 text-sm mt-1 font-medium italic">Manage user wallets, balances, and funding requests</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg" />
                <div className="w-12 h-4 bg-white/5 rounded" />
              </div>
              <div>
                <div className="w-24 h-3 bg-white/5 rounded mb-2" />
                <div className="w-32 h-8 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <WalletStats
          totalBalance={stats.totalBalance}
          pendingFunds={stats.pendingFunds}
          monthCredit={stats.monthCredit}
          monthDebit={stats.monthDebit}
        />
      ) : null}

      {/* Pending Requests */}
      {requestsLoading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-md animate-pulse">
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-white/5 rounded" />
              <div className="w-24 h-3 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      ) : requests && requests.length > 0 ? (
        <PendingRequests
          requests={requests}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      ) : null}

      {/* Wallet Table */}
      {walletsLoading ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-md animate-pulse">
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/5" />
            <div className="space-y-2">
              <div className="w-32 h-4 bg-white/5 rounded" />
              <div className="w-24 h-3 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      ) : wallets ? (
        <WalletTable
          wallets={wallets}
          onAdjustBalance={handleAdjustBalance}
          onViewDetails={handleViewDetails}
          onBlockWallet={handleBlockWallet}
        />
      ) : null}

      {/* Adjust Balance Dialog */}
      <AdjustBalanceDialog
        open={showAdjustDialog}
        onOpenChange={setShowAdjustDialog}
        wallet={selectedWallet}
        onSubmit={handleSubmitAdjustment}
      />
    </div>
  );
}
