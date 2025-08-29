import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, Hash, MapPin } from "lucide-react";

interface TransactionHistoryProps {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    tx_id: string;
    address: string;
    created_at: string;
  }>;
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return <ArrowDownLeft className="h-4 w-4 text-green-400" />;
      case 'withdrawal':
      case 'debit':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />;
      default:
        return <DollarSign className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return 'text-green-400';
      case 'withdrawal':
      case 'debit':
        return 'text-red-400';
      default:
        return 'text-blue-400';
    }
  };

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-400" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transaction history found</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/10 overflow-y-auto overflow-x-hidden max-h-96 custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Amount</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white">Transaction ID</TableHead>
                  <TableHead className="text-white">Address</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`text-sm font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-white text-sm">{transaction.description}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white text-sm font-mono">{transaction.tx_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white text-sm font-mono">{transaction.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white text-sm">{formatDate(transaction.created_at)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 