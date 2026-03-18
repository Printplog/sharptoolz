import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface WalletStatsProps {
  totalBalance: number;
  pendingFunds: number;
  monthCredit: number;
  monthDebit: number;
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

export default function WalletStats({ totalBalance, pendingFunds, monthCredit, monthDebit }: WalletStatsProps) {
  const stats: Stat[] = [
    {
      title: 'Total Balance',
      value: `$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      label: 'Total user funds',
      icon: Wallet,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      gradient: 'from-blue-500/20 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Pending Funds',
      value: `$${pendingFunds.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      label: 'Awaiting approval',
      icon: DollarSign,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      gradient: 'from-orange-500/20 to-orange-600/5',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-400',
    },
    {
      title: 'This Month Credited',
      value: `$${monthCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      label: 'Total inflow',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      gradient: 'from-green-500/20 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      title: 'This Month Debited',
      value: `$${monthDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      label: 'Total outflow',
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      gradient: 'from-red-500/20 to-red-600/5',
      borderColor: 'border-red-500/20',
      iconColor: 'text-red-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className={`bg-gradient-to-br ${stat.gradient} ${stat.borderColor} border rounded-2xl p-6 backdrop-blur-md hover:border-white/20 transition-all duration-300`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
              {stat.title}
            </p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-xs text-white/40 mt-1">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
