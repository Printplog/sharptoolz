import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Tag, Hash } from "lucide-react";

interface PurchaseHistoryProps {
  purchases: Array<{
    id: string;
    template_name: string;
    name: string;
    test: boolean;
    status: string;
    tracking_id: string;
    created_at: string;
    updated_at: string;
  }>;
}

export default function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
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
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-400" />
          Purchase History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {purchases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No purchase history found</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/10 overflow-y-auto overflow-x-hidden max-h-96 custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white">Template</TableHead>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Tracking ID</TableHead>
                  <TableHead className="text-white">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        <span className="text-white font-medium">{purchase.template_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{purchase.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className={`text-sm ${purchase.test ? 'text-orange-400' : 'text-green-400'}`}>
                          {purchase.test ? 'Test' : 'Live'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getStatusColor(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white text-sm font-mono">{purchase.tracking_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-white text-sm">{formatDate(purchase.created_at)}</span>
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