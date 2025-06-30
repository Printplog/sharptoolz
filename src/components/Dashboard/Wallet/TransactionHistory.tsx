import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'deposit' | 'payment';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending';
}

const TransactionHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const transactions: Transaction[] = [
    { id: 1, type: 'deposit', description: 'Wallet Top-up', amount: 50.00, date: '2025-06-30', status: 'completed' },
    { id: 2, type: 'payment', description: 'Document Processing', amount: -12.50, date: '2025-06-29', status: 'completed' },
    { id: 3, type: 'deposit', description: 'Wallet Top-up', amount: 25.00, date: '2025-06-28', status: 'completed' },
    { id: 4, type: 'payment', description: 'API Usage', amount: -8.90, date: '2025-06-27', status: 'completed' },
    { id: 5, type: 'deposit', description: 'Wallet Top-up', amount: 100.00, date: '2025-06-26', status: 'completed' },
    { id: 6, type: 'payment', description: 'Premium Feature', amount: -15.00, date: '2025-06-25', status: 'completed' },
    { id: 7, type: 'deposit', description: 'Wallet Top-up', amount: 75.00, date: '2025-06-24', status: 'pending' },
    { id: 8, type: 'payment', description: 'Document Export', amount: -5.50, date: '2025-06-23', status: 'completed' },
    { id: 9, type: 'deposit', description: 'Wallet Top-up', amount: 30.00, date: '2025-06-22', status: 'completed' },
    { id: 10, type: 'payment', description: 'Storage Usage', amount: -3.25, date: '2025-06-21', status: 'completed' },
    { id: 11, type: 'deposit', description: 'Wallet Top-up', amount: 60.00, date: '2025-06-20', status: 'completed' },
    { id: 12, type: 'payment', description: 'AI Processing', amount: -18.75, date: '2025-06-19', status: 'completed' }
  ];

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = (): void => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = (): void => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paginatedTransactions.map((transaction) => (
          <div 
            key={transaction.id} 
            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                transaction.type === 'deposit' ? 'bg-green-500/20' : 'bg-blue-500/20'
              }`}>
                {transaction.type === 'deposit' ? 
                  <ArrowDownLeft className="w-4 h-4 text-green-400" /> : 
                  <ArrowUpRight className="w-4 h-4 text-blue-400" />
                }
              </div>
              <div>
                <p className="text-white text-sm font-medium">{transaction.description}</p>
                <p className="text-white/40 text-xs">{transaction.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                transaction.type === 'deposit' ? 'text-green-400' : 'text-white'
              }`}>
                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-white/40 text-xs capitalize">{transaction.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-white/60 text-sm">
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, transactions.length)} of {transactions.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-white/60 text-sm">{currentPage} of {totalPages}</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory;