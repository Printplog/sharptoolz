import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/api/apiEndpoints";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AuditLogsPage() {
    const { data: logs, isLoading, error } = useQuery({
        queryKey: ["auditLogs"],
        queryFn: getAuditLogs,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-2 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p>Failed to load audit logs</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle>System Activity</CardTitle>
                    <CardDescription>Track all administrative actions and system changes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-white/5 hover:bg-white/5">
                                <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-white/60">Timestamp</TableHead>
                                    <TableHead className="text-white/60">Actor</TableHead>
                                    <TableHead className="text-white/60">Action</TableHead>
                                    <TableHead className="text-white/60">Target</TableHead>
                                    <TableHead className="text-white/60">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs?.map((log: any) => (
                                    <TableRow key={log.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-mono text-sm text-white/70">
                                            {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{log.actor_name || "System"}</span>
                                                <span className="text-xs text-white/40">{log.ip_address}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-white/5 border-white/10 text-white/80">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-white/80">{log.target}</TableCell>
                                        <TableCell className="max-w-[300px] truncate text-xs font-mono text-white/50">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!logs?.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-white/50">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
