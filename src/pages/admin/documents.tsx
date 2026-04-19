import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminDocuments } from "@/api/apiEndpoints";
import { DataTable } from "@/components/ui/data-table";
import {
    FileText,
    BadgeCheck,
    FlaskConical,
    User,
    DollarSign,
    TrendingUp,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import type { ColumnDef } from '@tanstack/react-table';

type AdminDoc = {
    id: string;
    name: string;
    test: boolean;
    tracking_id: string;
    created_at: string;
    buyer: { id: number; username: string; email: string } | null;
    template: { id: string; name: string } | null;
};

type AdminDocsResponse = {
    results: AdminDoc[];
    count: number;
    total_pages: number;
    current_page: number;
    stats: {
        total_purchases: number;
        total_revenue: number;
        popular_template: string;
        recent_count: number;
    };
};

export default function AdminDocumentsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<'all' | 'paid' | 'test'>('all');

    const PAGE_SIZE = 20;

    const { data, isLoading } = useQuery<AdminDocsResponse>({
        queryKey: ["adminDocuments", { page, search: searchQuery }],
        queryFn: () => adminDocuments({ page, page_size: PAGE_SIZE, search: searchQuery }),
        staleTime: 30_000,
    });

    const docs = data?.results ?? [];
    const filteredDocs = useMemo(
        () =>
            docs.filter((doc) =>
                typeFilter === 'all' ? true : typeFilter === 'paid' ? !doc.test : doc.test
            ),
        [docs, typeFilter]
    );
    const totalPages = data?.total_pages ?? 1;
    const totalCount = data?.count ?? 0;
    const stats = data?.stats;

    const statsCards: StatData[] = [
        {
            title: 'Total Purchases',
            value: stats?.total_purchases.toLocaleString() ?? '0',
            label: 'All time',
            icon: FileText,
            gradient: 'from-blue-500/20 to-blue-600/5',
            borderColor: 'border-blue-500/20',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400',
        },
        {
            title: 'Total Revenue',
            value: `$${stats?.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) ?? '0.00'}`,
            label: 'From paid templates',
            icon: DollarSign,
            gradient: 'from-green-500/20 to-green-600/5',
            borderColor: 'border-green-500/20',
            iconBg: 'bg-green-500/10',
            iconColor: 'text-green-400',
        },
        {
            title: 'Popular Template',
            value: stats?.popular_template ?? 'N/A',
            label: 'Most purchased',
            icon: TrendingUp,
            gradient: 'from-orange-500/20 to-orange-600/5',
            borderColor: 'border-orange-500/20',
            iconBg: 'bg-orange-500/10',
            iconColor: 'text-orange-400',
        },
        {
            title: 'Recent Activity',
            value: stats?.recent_count.toLocaleString() ?? '0',
            label: 'Last 7 days',
            icon: Clock,
            gradient: 'from-red-500/20 to-red-600/5',
            borderColor: 'border-red-500/20',
            iconBg: 'bg-red-500/10',
            iconColor: 'text-red-400',
        },
    ];

    const columns = useMemo<ColumnDef<AdminDoc>[]>(() => [
        {
            accessorKey: 'name',
            header: 'Template File',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-white font-semibold text-sm truncate max-w-[180px]">{row.original.name}</p>
                        <p className="text-white/30 text-[11px] font-mono">{row.original.tracking_id}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'buyer',
            header: 'Buyer',
            cell: ({ row }) => row.original.buyer ? (
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <User className="h-3.5 w-3.5 text-white/50" />
                    </div>
                    <div>
                        <p className="text-white text-sm font-medium">{row.original.buyer.username}</p>
                        <p className="text-white/30 text-[11px]">{row.original.buyer.email}</p>
                    </div>
                </div>
            ) : (
                <span className="text-white/20 text-sm italic">Deleted user</span>
            ),
        },
        {
            id: 'template',
            header: 'Original Template',
            cell: ({ row }) => (
                <span
                    className="text-white/60 text-sm truncate max-w-[150px] block"
                    title={row.original.template?.name || undefined}
                >
                    {row.original.template?.name ?? <span className="text-white/20 italic">Deleted</span>}
                </span>
            ),
        },
        {
            id: 'type',
            header: 'Type',
            cell: ({ row }) => (
                <span
                    className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest",
                        row.original.test
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                    )}
                >
                    {row.original.test ? <FlaskConical className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
                    {row.original.test ? "Test" : "Paid"}
                </span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => (
                <span className="text-white/40 text-sm">
                    {new Date(row.original.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </span>
            ),
        },
    ], []);

    const filters = useMemo(() => [
        {
            key: 'type',
            label: 'Type',
            value: typeFilter,
            onChange: (value: string) => {
                setTypeFilter(value as 'all' | 'paid' | 'test');
                setPage(1);
            },
            options: [
                { label: 'All types', value: 'all' },
                { label: 'Paid', value: 'paid' },
                { label: 'Test', value: 'test' },
            ],
            placeholder: 'Type',
        },
    ], [typeFilter]);

    return (
        <div className="dashboard-content space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
                    Purchased <span className="text-primary">Templates</span>
                </h1>
                <p className="text-white/40 text-sm mt-1">Manage all user-purchased templates</p>
            </div>

            <StatsCards stats={statsCards} isLoading={isLoading} />

            <DataTable
                columns={columns}
                data={filteredDocs}
                isLoading={isLoading}
                searchValue={searchQuery}
                onSearchChange={(value) => {
                    setSearchQuery(String(value));
                    setPage(1);
                }}
                searchPlaceholder="Search by name, user, template, tracking..."
                filters={filters}
                emptyMessage="No purchased templates found."
                hideColumnToggle
                enableSelection={false}
                pagination={{
                    page,
                    pageSize: PAGE_SIZE,
                    totalItems: totalCount,
                    totalPages,
                    onPageChange: setPage,
                }}
            />
        </div>
    );
}
