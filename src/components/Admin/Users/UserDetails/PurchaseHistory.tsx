import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar,  Eye, Clock, FlaskConical, BadgeCheck } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";
import { formatAdminDateTime } from "@/lib/utils/adminDate";

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
  const getStatusColor = (status?: string) => {
    switch ((status ?? "").toLowerCase()) {
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
          <div className="rounded-md border border-white/10 overflow-y-auto overflow-x-hidden max-h-96">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 bg-white/5 transition-colors">
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Template</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Name</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Type</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Status</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Tracking ID</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4">Created</TableHead>
                  <TableHead className="text-white/40 font-black uppercase tracking-tighter text-[10px] py-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-white font-bold text-sm tracking-tight">{purchase.template_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white/60 text-[13px]">{purchase.name}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          purchase.test
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                        )}
                      >
                        {purchase.test ? <FlaskConical className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
                        {purchase.test ? "Test" : "Paid"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                          purchase.status === "completed" ? "bg-green-500" : 
                          purchase.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                        )} />
                        <span className={cn("text-[11px] font-black uppercase tracking-widest", getStatusColor(purchase.status))}>
                          {purchase.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-white/30 text-[11px] font-mono tracking-tighter uppercase">{purchase.tracking_id}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-white/60 text-[13px]">
                          <Calendar className="h-3 w-3" />
                          <span>{formatAdminDateTime(purchase.created_at).split(',')[0]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/20 text-[10px]">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{formatAdminDateTime(purchase.created_at).split(',')[1]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <PremiumButton
                        href={`/documents/${purchase.id}`}
                        target="_blank"
                        rel="noreferrer"
                        variant="outline"
                        text="VIEW"
                        icon={Eye}
                        className="border-white/10"
                      />
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
