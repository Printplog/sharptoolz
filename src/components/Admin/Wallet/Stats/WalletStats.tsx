import { ArrowLeftRight, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { StatsCards, type StatData } from '@/components/Admin/Shared/StatsCards';

interface WalletStatsProps {
  totalBalance: number;
  totalInflow: number;
  totalOutflow: number;
  netFlow: number;
  transactionCount: number;
  fundedWallets: number;
  rangeLabel: string;
}

interface Stat {
  title: string;
  value: string;
  label: string;
  icon: any;
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
  netFlow,
  transactionCount,
  fundedWallets,
  rangeLabel,
}: WalletStatsProps) {
  const netPositive = netFlow >= 0;

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
      title: 'Money In',
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
      title: 'Money Out',
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
      title: 'Net Flow',
      value: `${netPositive ? '+' : '-'}${formatCurrency(netFlow)}`,
      label: `${rangeLabel} cash movement`,
      icon: ArrowLeftRight,
      color: netPositive ? 'text-emerald-400' : 'text-amber-300',
      bgColor: netPositive ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      gradient: netPositive ? 'from-emerald-500/20 to-emerald-600/5' : 'from-amber-500/20 to-amber-600/5',
      borderColor: netPositive ? 'border-emerald-500/20' : 'border-amber-500/20',
      iconColor: netPositive ? 'text-emerald-400' : 'text-amber-300',
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

  return <StatsCards stats={statItems} />;
}
