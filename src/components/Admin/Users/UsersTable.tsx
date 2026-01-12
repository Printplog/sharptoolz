import { useUsersStore } from "@/store/usersStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ChevronLeft, ChevronRight, Mail, User as UserIcon, Download, HandCoins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { adminUserDetails } from "@/api/apiEndpoints";

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

  const parentRef = useRef<HTMLDivElement>(null);

  const users = data?.users?.results || [];

  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 73, // Estimated height of a table row
    overscan: 5,
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const totalPages = data?.users?.total_pages || 1;
  const totalUsers = data?.users?.count || 0;

  if (error) {
    return (
      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardContent className="p-6">
          <p className="text-red-400 text-center">Error loading users data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
          <span>Users List</span>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 w-full sm:w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
              />
            </div>
            <Button onClick={handleSearch} variant="outline" size="sm" className="w-full sm:w-fit">
              Search
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="rounded-md border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                    <TableHead><Skeleton className="h-4 w-20 bg-white/10" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-10 w-full bg-white/5" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 bg-white/5" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div
              ref={parentRef}
              className="rounded-md border border-white/10 overflow-auto custom-scrollbar max-h-[600px] relative"
            >
              <Table>
                <TableHeader className="sticky top-0 bg-zinc-950 z-10">
                  <TableRow className="border-white/10 bg-zinc-950 hover:bg-zinc-950">
                    <TableHead className="text-white">User</TableHead>
                    <TableHead className="text-white">Email</TableHead>
                    <TableHead className="text-white">Purchases</TableHead>
                    <TableHead className="text-white">Downloads</TableHead>
                    <TableHead className="text-white">Wallet Balance</TableHead>
                    <TableHead className="text-white">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody
                  className="relative"
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const user = users[virtualRow.index];
                    return (
                      <TableRow
                        key={user.pk}
                        className="border-white/10 hover:bg-white/5 absolute left-0 w-full"
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-white uppercase">{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-white">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <HandCoins className="h-4 w-4 text-green-400" />
                            <span className="text-white">{user.total_purchases}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4 text-blue-400" />
                            <span className="text-white">{user.downloads}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-400 font-medium">
                            ${user.wallet_balance}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/admin/users/${user.pk}`}
                            onMouseEnter={() => handlePrefetchUser(String(user.pk))}
                          >
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to{" "}
                {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      {currentPage > 3 && <span className="text-muted-foreground">...</span>}
                      {currentPage > 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage)}
                          className="w-8 h-8 p-0"
                        >
                          {currentPage}
                        </Button>
                      )}
                      {currentPage < totalPages - 2 && <span className="text-muted-foreground">...</span>}
                      {currentPage < totalPages - 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Empty State */}
            {data?.users?.results?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search criteria
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 