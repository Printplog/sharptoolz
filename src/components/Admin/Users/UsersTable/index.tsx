import { useUsersStore } from "@/store/usersStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { adminUserDetails } from "@/api/apiEndpoints";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import UserRow from "./UserRow";
import EmptyState from "./EmptyState";

export default function UsersTable() {
    const queryClient = useQueryClient();
    const {
        data,
        isLoading,
        error,
        currentPage,
        pageSize,
        searchInput,
        searchQuery,
        setCurrentPage,
        setSearchInput,
        handleSearch,
    } = useUsersStore();

    const handlePrefetchUser = (userId: string) => {
        queryClient.prefetchQuery({
            queryKey: ["adminUserDetails", userId],
            queryFn: () => adminUserDetails(userId),
        });
    };

    const users = data?.users?.results || [];

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const totalPages = data?.users?.total_pages || 1;
    const totalUsers = data?.users?.count || 0;

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                <div className="p-3 bg-red-hey, 500/20 rounded-full">
                    <Shield className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-red-400 font-medium text-lg">Error loading users data</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full hidden md:block" />
                    <h2 className="text-xl font-semibold text-white">All Users</h2>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold tracking-tight">
                        {totalUsers} TOTAL
                    </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Filter by name or email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="pl-10 h-11 w-full bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all outline-0 backdrop-blur-sm"
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

            {/* Table Container */}
            <div className="bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">User Information</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Access Level</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Platform Usage</th>
                                <th className="px-6 py-5 text-left text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Wallet Status</th>
                                <th className="px-6 py-5 text-right text-white/40 text-[11px] font-black uppercase tracking-[0.1em]">Options</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.03]">
                                        <td className="px-6 py-4"><Skeleton className="h-12 w-48 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-24 bg-white/5 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-32 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-20 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-10 w-28 bg-white/5 rounded-xl ml-auto" /></td>
                                    </tr>
                                ))
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {users.map((user, index) => (
                                        <UserRow
                                            key={user.pk}
                                            user={user}
                                            index={index}
                                            onPrefetch={handlePrefetchUser}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/[0.01]">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">
                            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalUsers)} • <span className="text-white/70">{totalUsers} Records</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-10 h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-5 w-5 text-white" />
                        </Button>

                        <div className="flex items-center gap-2">
                            {Object.keys(Array.from({ length: Math.min(5, totalPages) })).map((_, i) => {
                                const pageNum = i + 1;
                                const isActive = currentPage === pageNum;
                                return (
                                    <Button
                                        key={pageNum}
                                        className={cn(
                                            "w-10 h-10 p-0 rounded-xl transition-all font-black text-sm active:scale-90",
                                            isActive
                                                ? "bg-primary text-background hover:bg-primary"
                                                : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20"
                                        )}
                                        onClick={() => setCurrentPage(pageNum)}
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
                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-5 w-5 text-white" />
                        </Button>
                    </div>
                </div>

                {/* Empty State */}
                {!isLoading && users.length === 0 && (
                    <EmptyState
                        searchQuery={searchQuery}
                        onReset={() => {
                            setSearchInput("");
                            handleSearch();
                        }}
                    />
                )}
            </div>
        </div>
    );
}
