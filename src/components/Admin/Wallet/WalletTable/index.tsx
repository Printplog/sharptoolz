import { useState } from 'react';
import { Search, Filter, MoreVertical, Eye, Edit, Ban, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

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

interface WalletTableProps {
  wallets: UserWallet[];
  onAdjustBalance: (wallet: UserWallet) => void;
  onViewDetails: (wallet: UserWallet) => void;
  onBlockWallet: (wallet: UserWallet) => void;
}

export default function WalletTable({
  wallets,
  onAdjustBalance,
  onViewDetails,
  onBlockWallet,
}: WalletTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');

  const filteredWallets = wallets.filter((wallet) => {
    const matchesSearch =
      wallet.user.email.toLowerCase().includes(search.toLowerCase()) ||
      wallet.user.username.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || wallet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">User Wallets</h2>
            <p className="text-xs text-white/40">Manage user wallet balances</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10 w-64 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1a1a1a] border-white/10">
                <DropdownMenuItem
                  onClick={() => setStatusFilter('all')}
                  className="text-white focus:bg-white/10"
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter('active')}
                  className="text-white focus:bg-white/10"
                >
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setStatusFilter('blocked')}
                  className="text-white focus:bg-white/10"
                >
                  Blocked
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="text-left py-4 px-6 text-xs font-bold text-white/40 uppercase tracking-wider">
                User
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold text-white/60 uppercase tracking-wider">
                Balance
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold text-white/60 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-4 px-6 text-xs font-bold text-white/60 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right py-4 px-6 text-xs font-bold text-white/60 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredWallets.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-white/40">
                  No wallets found
                </td>
              </tr>
            ) : (
              filteredWallets.map((wallet) => (
                <tr
                  key={wallet.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-semibold text-white">{wallet.user.username}</p>
                      <p className="text-xs text-white/40">{wallet.user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-white">
                      ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant={wallet.status === 'active' ? 'default' : 'destructive'}
                      className={
                        wallet.status === 'active'
                          ? 'bg-green-500/20 text-green-500 border-green-500/30'
                          : 'bg-red-500/20 text-red-500 border-red-500/30'
                      }
                    >
                      {wallet.status === 'active' ? (
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
                  </td>
                  <td className="py-4 px-6 text-xs text-white/40">
                    {new Date(wallet.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/40 hover:text-white hover:bg-white/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-white/10">
                        <DropdownMenuItem
                          onClick={() => onViewDetails(wallet)}
                          className="text-white focus:bg-white/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onAdjustBalance(wallet)}
                          className="text-white focus:bg-white/10"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Adjust Balance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onBlockWallet(wallet)}
                          className="text-white focus:bg-white/10"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          {wallet.status === 'active' ? 'Block Wallet' : 'Unblock Wallet'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
