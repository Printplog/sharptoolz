import { useUsersStore } from "@/store/usersStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Mail, User as UserIcon, Download, HandCoins, ExternalLink, Shield, ShieldCheck, Wallet, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { adminUserDetails } from "@/api/apiEndpoints";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
        <div className="p-3 bg-red-500/20 rounded-full">
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
            className="h-11 px-8 rounded-xl bg-primary text-background font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
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
                    <motion.tr
                      key={user.pk}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* User Info */}
                      <td className="px-6 py-4 min-w-[280px]">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110",
                            user.role === "ZK7T-93XY" ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]" :
                              user.role === "S9K3-41TV" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" :
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          )}>
                            {user.role === "ZK7T-93XY" ? <ShieldCheck className="h-6 w-6" /> :
                              user.role === "S9K3-41TV" ? <Shield className="h-6 w-6" /> :
                                <UserIcon className="h-6 w-6" />}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-[13px] tracking-tight uppercase group-hover:text-primary transition-colors truncate">
                              {user.username}
                            </span>
                            <div className="flex items-center gap-1.5 text-white/30 text-[11px] truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Access Level */}
                      <td className="px-6 py-4 min-w-[180px]">
                        <div className="flex flex-col gap-1.5">
                          <div className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[0.05em] w-fit uppercase flex items-center gap-1.5 shadow-sm",
                            user.role === "ZK7T-93XY" ? "bg-primary/10 text-primary border border-primary/20" :
                              user.role === "S9K3-41TV" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                "bg-white/5 text-white/50 border border-white/10"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full",
                              user.role === "ZK7T-93XY" ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" :
                                user.role === "S9K3-41TV" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" :
                                  "bg-white/20")} />
                            {user.role === "ZK7T-93XY" ? "Admin Access" :
                              user.role === "S9K3-41TV" ? "Staff Member" :
                                "Standard User"}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/20">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(user.date_joined).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </td>

                      {/* Platform Usage */}
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <HandCoins className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-white font-black text-sm">{user.total_purchases}</span>
                            </div>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Orders</span>
                          </div>
                          <div className="w-[1px] h-8 bg-white/10" />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Download className="h-3.5 w-3.5 text-blue-400" />
                              <span className="text-white font-black text-sm">{user.downloads}</span>
                            </div>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Files</span>
                          </div>
                        </div>
                      </td>

                      {/* Wallet Status */}
                      <td className="px-6 py-4 min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-white leading-none tracking-tighter">
                              <span className="text-emerald-400 text-sm italic mr-0.5 font-bold">$</span>
                              {parseFloat(user.wallet_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-emerald-400/50 font-bold uppercase tracking-widest mt-0.5">Balance</span>
                          </div>
                        </div>
                      </td>

                      {/* Options */}
                      <td className="px-6 py-4 text-right min-w-[140px]">
                        <Link
                          to={`/admin/users/${user.pk}`}
                          onMouseEnter={() => handlePrefetchUser(String(user.pk))}
                        >
                          <Button
                            variant="outline"
                            className="h-10 px-5 rounded-xl border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-primary hover:border-primary hover:text-background font-bold group/btn transition-all active:scale-95 shadow-lg shadow-black/20"
                          >
                            <span>MANAGE</span>
                            <ExternalLink className="ml-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </Button>
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Premium Pagination */}
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
                        ? "bg-primary text-background shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:bg-primary"
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

        {/* Custom Empty State */}
        {!isLoading && users.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center"
          >
            <div className="p-6 bg-white/5 rounded-[2rem] mb-6 border border-white/10 rotate-12 shadow-2xl">
              <UserIcon className="h-12 w-12 text-white/10 -rotate-12" />
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">User Search Exhausted</h3>
            <p className="text-white/30 text-sm max-w-[280px] mt-3 font-medium">
              We scanned our database but couldn't find matches for <span className="text-primary italic">"{searchQuery}"</span>.
            </p>
            <Button
              variant="outline"
              className="mt-8 rounded-full px-8 border-primary/20 text-primary hover:bg-primary hover:text-background font-black transition-all"
              onClick={() => {
                setSearchInput("");
                handleSearch();
              }}
            >
              RESET FILTERS
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}