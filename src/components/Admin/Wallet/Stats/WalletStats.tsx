import { BadgeDollarSign, ShoppingBag, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { StatsCards, type StatData } from '@/components/Admin/Shared/StatsCards';

import type { LucideIcon } from 'lucide-react';

interface WalletStatsProps {
  totalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  allTimeEarned: number;
  allTimePurchases: number;
  transactionCount: number;
  fundedWallets: number;
  rangeLabel: string;
}

interface Stat {
  title: string;
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}

function formatCurrency(value: number) {
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function WalletStats({
  totalBalance,
  totalInflow,
  totalOutflow,
  allTimeEarned,
  allTimePurchases,
  transactionCount,
  fundedWallets,
  rangeLabel,
}: WalletStatsProps) {
  const stats: Stat[] = [
    {
      title: 'Total Balance',
      value: formatCurrency(totalBalance),
      label: 'Current funds across user wallets',
      icon: Wallet,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      gradient: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Total Deposits',
      value: formatCurrency(totalInflow),
      label: `${rangeLabel} • ${fundedWallets} wallets funded`,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      gradient: 'from-green-500/20 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      title: 'User Spending',
      value: formatCurrency(totalOutflow),
      label: `${rangeLabel} • ${transactionCount} completed transactions`,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      gradient: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      title: 'All-time earned',
      value: formatCurrency(allTimeEarned),
      label: 'Completed customer deposits since launch',
      icon: BadgeDollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      gradient: 'from-emerald-500/20 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'All purchases',
      value: formatCurrency(allTimePurchases),
      label: 'Completed customer purchases since launch',
      icon: ShoppingBag,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10',
      gradient: 'from-violet-500/20 to-violet-600/5',
      borderColor: 'border-violet-500/20',
      iconColor: 'text-violet-400',
    },
  ];

  const statItems: StatData[] = stats.map((stat) => ({
    title: stat.title,
    value: stat.value,
    label: stat.label,
    icon: stat.icon,
    gradient: stat.gradient,
    borderColor: stat.borderColor,
    iconBg: stat.bgColor,
    iconColor: stat.iconColor,
  }));

  return <StatsCards stats={statItems} className="xl:grid-cols-5" />;
}
