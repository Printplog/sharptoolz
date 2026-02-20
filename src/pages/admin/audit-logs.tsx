import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/api/apiEndpoints";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AuditLog } from "@/types";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import TableSkeleton from "@/components/Admin/Layouts/TableSkeleton";

const columns: ColumnDef<AuditLog>[] = [
    {
        accessorKey: "timestamp",
        header: "Timestamp",
        cell: ({ row }) => (
            <span className="font-mono text-sm text-white/70">
                {format(new Date(row.original.timestamp), "MMM d, yyyy HH:mm:ss")}
            </span>
        ),
    },
    {
        accessorKey: "actor_name",
        header: "Actor",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-white">
                    {row.original.actor_name || "System"}
                </span>
                <span className="text-xs text-white/40">{row.original.ip_address}</span>
            </div>
        ),
        filterFn: (row, _id, value) => {
            const needle = (value as string)?.toLowerCase?.() ?? "";
            if (!needle) return true;
            return (
                (row.original.actor_name ?? "").toLowerCase().includes(needle) ||
                row.original.target.toLowerCase().includes(needle) ||
                row.original.action.toLowerCase().includes(needle)
            );
        },
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
            <Badge
                variant="outline"
                className="bg-white/5 border-white/10 text-white/80"
            >
                {row.original.action}
            </Badge>
        ),
    },
    {
        accessorKey: "target",
        header: "Target",
        cell: ({ row }) => (
            <span className="text-white/80">{row.original.target}</span>
        ),
    },
    {
        id: "details",
        header: "Details",
        enableSorting: false,
        cell: ({ row }) => (
            <span
                className="max-w-[300px] truncate text-xs font-mono text-white/50 block"
                title={JSON.stringify(row.original.details, null, 2)}
            >
                {JSON.stringify(row.original.details)}
            </span>
        ),
    },
];

export default function AuditLogsPage() {
    const { data: logs, isLoading, error } = useQuery<AuditLog[]>({
        queryKey: ["auditLogs"],
        queryFn: getAuditLogs,
        refetchInterval: 30000,
    });

    if (isLoading) return <TableSkeleton />;

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
                <div>
                    <h1 className="text-2xl font-semibold">Audit Logs</h1>
                    <p className="text-white/60 mt-1">
                        Track all administrative actions and system changes.
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={logs ?? []}
                filterKey="actor_name"
                searchPlaceholder="Search by actor, action, or target..."
                emptyMessage="No logs found."
                hideColumnToggle
            />
        </div>
    );
}
