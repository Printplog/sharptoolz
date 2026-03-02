import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminDocuments } from "@/api/apiEndpoints";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    BadgeCheck,
    FlaskConical,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminDoc = {
    id: string;
    name: string;
    test: boolean;
    tracking_id: string;
    status: string;
    created_at: string;
    buyer: { id: number; username: string; email: string } | null;
    template: { id: string; name: string } | null;
};

type AdminDocsResponse = {
    results: AdminDoc[];
    count: number;
    total_pages: number;
    current_page: number;
};

export default function AdminDocumentsPage() {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const PAGE_SIZE = 20;

    const { data, isLoading } = useQuery<AdminDocsResponse>({
        queryKey: ["adminDocuments", { page, search: searchQuery }],
        queryFn: () => adminDocuments({ page, page_size: PAGE_SIZE, search: searchQuery }),
        staleTime: 30_000,
    });

    const docs = data?.results ?? [];
    const totalPages = data?.total_pages ?? 1;
    const totalCount = data?.count ?? 0;

    const handleSearch = () => {
        setPage(1);
        setSearchQuery(searchInput);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                    All <span className="text-primary">Documents</span>
                </h1>
                <p className="text-white/40 text-sm mt-1">Manage all user-purchased documents</p>
            </div>

            {/* Search & Info Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full hidden md:block" />
                    <h2 className="text-xl font-semibold text-white">Documents</h2>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold tracking-tight">
                        {totalCount} TOTAL
                    </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Search by name, user, template, tracking..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 h-11 w-full bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all outline-0"
                        />
                    </div>
                    <Button
                        onClick={handleSearch}
                        className="h-11 px-8 rounded-xl bg-primary text-background font-bold hover:bg-primary/90 transition-all active:scale-95"
                    >
                        Search
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Document</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Buyer</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Template</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Type</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading
                                ? Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.03]">
                                        <td className="px-6 py-4"><Skeleton className="h-10 w-48 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-36 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-28 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 bg-white/5 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 bg-white/5 rounded-lg" /></td>
                                    </tr>
                                ))
                                : docs.map((doc) => (
                                    <tr
                                        key={doc.id}
                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                                    >
                                        {/* Document name + tracking */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-semibold text-sm truncate max-w-[180px]">{doc.name}</p>
                                                    <p className="text-white/30 text-[11px] font-mono">{doc.tracking_id}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Buyer */}
                                        <td className="px-6 py-4">
                                            {doc.buyer ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <User className="h-3.5 w-3.5 text-white/50" />
                                                    </div>
                                                    <div>
                                                        <p className="text-white text-sm font-medium">{doc.buyer.username}</p>
                                                        <p className="text-white/30 text-[11px]">{doc.buyer.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-white/20 text-sm italic">Deleted user</span>
                                            )}
                                        </td>

                                        {/* Template */}
                                        <td className="px-6 py-4">
                                            <span className="text-white/60 text-sm">
                                                {doc.template?.name ?? <span className="text-white/20 italic">Deleted</span>}
                                            </span>
                                        </td>

                                        {/* Type badge */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest",
                                                    doc.test
                                                        ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                        : "bg-green-500/10 text-green-400 border border-green-500/20"
                                                )}
                                            >
                                                {doc.test ? <FlaskConical className="h-3 w-3" /> : <BadgeCheck className="h-3 w-3" />}
                                                {doc.test ? "Test" : "Paid"}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4">
                                            <span className="text-white/40 text-sm">
                                                {new Date(doc.created_at).toLocaleDateString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} •{" "}
                            <span className="text-white/70">{totalCount} Records</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-5 w-5 text-white" />
                        </Button>

                        <div className="flex items-center gap-2">
                            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                const pageNum = i + 1;
                                const isActive = page === pageNum;
                                return (
                                    <Button
                                        key={pageNum}
                                        className={cn(
                                            "w-10 h-10 p-0 rounded-xl transition-all font-black text-sm active:scale-90",
                                            isActive
                                                ? "bg-primary text-background hover:bg-primary"
                                                : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20"
                                        )}
                                        onClick={() => setPage(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </div>

                {/* Empty */}
                {!isLoading && docs.length === 0 && (
                    <div className="py-20 flex flex-col items-center gap-4 text-white/30">
                        <FileText className="h-12 w-12 opacity-20" />
                        <p className="text-sm italic">
                            {searchQuery ? `No documents match "${searchQuery}"` : "No documents found."}
                        </p>
                        {searchQuery && (
                            <Button
                                variant="outline"
                                className="border-white/10 text-white/50"
                                onClick={() => { setSearchInput(""); setSearchQuery(""); setPage(1); }}
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
