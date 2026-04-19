import { useMemo, useState } from 'react';
import { useUsersStore } from '@/store/usersStore';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Mail, User as UserIcon, Download, HandCoins, ExternalLink, Shield, ShieldCheck, Wallet, Calendar } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { adminUserDetails } from '@/api/apiEndpoints';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROLES } from '@/lib/constants/roles';
import type { ColumnDef } from '@tanstack/react-table';

interface UserData {
    pk: number;
    username: string;
    email: string;
    role: string;
    date_joined: string;
    total_purchases: number;
    downloads: number;
    wallet_balance: string;
}

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
        setSearchQuery,
        handleSearch,
    } = useUsersStore();

    const handlePrefetchUser = (userId: string) => {
        queryClient.prefetchQuery({
            queryKey: ['adminUserDetails', userId],
            queryFn: () => adminUserDetails(userId),
        });
    };

    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'staff' | 'user'>('all');

    const users = data?.users?.results || [];
    const filteredUsers = useMemo(
        () =>
            users.filter((user) =>
                roleFilter === 'all'
                    ? true
                    : roleFilter === 'user'
                    ? user.role !== 'admin' && user.role !== 'staff'
                    : user.role === roleFilter
            ),
        [users, roleFilter]
    );

    const totalPages = data?.users?.total_pages || 1;
    const totalUsers = data?.users?.count || 0;

    const columns = useMemo<ColumnDef<UserData>[]>(
        () => [
            {
                accessorKey: 'username',
                header: 'User Information',
                cell: ({ row }) => (
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110',
                            row.original.role === ROLES.ADMIN ? 'bg-primary/10 text-primary border border-primary/20' :
                            row.original.role === ROLES.STAFF ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        )}>
                            {row.original.role === ROLES.ADMIN ? <ShieldCheck className="h-6 w-6" /> :
                             row.original.role === ROLES.STAFF ? <Shield className="h-6 w-6" /> :
                             <UserIcon className="h-6 w-6" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-[13px] tracking-tight uppercase group-hover:text-primary transition-colors truncate">
                                {row.original.username}
                            </span>
                            <div className="flex items-center gap-1.5 text-white/30 text-[11px] truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{row.original.email}</span>
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'role',
                header: 'Access Level',
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1.5">
                        <div className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[0.05em] w-fit uppercase flex items-center gap-1.5',
                            row.original.role === ROLES.ADMIN ? 'bg-primary/10 text-primary border border-primary/20' :
                            row.original.role === ROLES.STAFF ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            'bg-white/5 text-white/50 border border-white/10'
                        )}>
                            <div className={cn('w-1.5 h-1.5 rounded-full',
                                row.original.role === ROLES.ADMIN ? 'bg-primary' :
                                row.original.role === ROLES.STAFF ? 'bg-amber-500' :
                                'bg-white/20'
                            )} />
                            {row.original.role === ROLES.ADMIN ? 'Admin Access' :
                             row.original.role === ROLES.STAFF ? 'Staff Member' :
                             'Standard User'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/20">
                            <Calendar className="w-3 h-3" />
                            <span>Joined {new Date(row.original.date_joined).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'total_purchases',
                header: 'Platform Usage',
                cell: ({ row }) => (
                    <div className="flex items-center gap-5">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <HandCoins className="h-3.5 w-3.5 text-emerald-400" />
                                <span className="text-white font-black text-sm">{row.original.total_purchases}</span>
                            </div>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Orders</span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Download className="h-3.5 w-3.5 text-blue-400" />
                                <span className="text-white font-black text-sm">{row.original.downloads}</span>
                            </div>
                            <span className="text-[9px] text-white/20 font-black uppercase tracking-widest mt-0.5">Files</span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: 'wallet_balance',
                header: 'Wallet Status',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-white leading-none tracking-tighter">
                                <span className="text-emerald-400 text-sm italic mr-0.5 font-bold">$</span>
                                {parseFloat(row.original.wallet_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] text-emerald-400/50 font-bold uppercase tracking-widest mt-0.5">Balance</span>
                        </div>
                    </div>
                ),
            },
            {
                id: 'actions',
                header: 'Options',
                cell: ({ row }) => (
                    <Link
                        to={`/admin/users/${row.original.pk}`}
                        onMouseEnter={() => handlePrefetchUser(String(row.original.pk))}
                    >
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </Link>
                ),
            },
        ],
        [handlePrefetchUser]
    );

    const filters = [
        {
            key: 'role',
            label: 'Role',
            value: roleFilter,
            onChange: (value: string) => setRoleFilter(value as 'all' | 'admin' | 'staff' | 'user'),
            options: [
                { label: 'All roles', value: 'all' },
                { label: 'Admin', value: 'admin' },
                { label: 'Staff', value: 'staff' },
                { label: 'Standard user', value: 'user' },
            ],
            placeholder: 'Role',
        },
    ];

    const handleSearchInput = (value: string) => {
        setSearchInput(value);
        setCurrentPage(1);
        setSearchQuery(value);
    };

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
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/20 rounded-full hidden md:block" />
                    <h2 className="text-xl font-semibold text-white">All users</h2>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-bold tracking-tight">
                        {totalUsers} total
                    </span>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredUsers}
                isLoading={isLoading}
                searchValue={searchInput}
                onSearchChange={(value) => handleSearchInput(String(value))}
                searchPlaceholder="Filter by name or email..."
                filters={filters}
                emptyMessage="No users found."
                pagination={{
                    page: currentPage,
                    pageSize,
                    totalItems: totalUsers,
                    totalPages,
                    onPageChange: setCurrentPage,
                }}
                hideColumnToggle
                enableSelection={false}
            />
        </div>
    );
}
