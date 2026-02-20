import { Mail, User as UserIcon, Download, HandCoins, ExternalLink, Shield, ShieldCheck, Wallet, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/lib/constants/roles";
import { motion } from "framer-motion";

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

interface UserRowProps {
    user: UserData;
    index: number;
    onPrefetch: (userId: string) => void;
}

export default function UserRow({ user, index, onPrefetch }: UserRowProps) {
    return (
        <motion.tr
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
                        user.role === ROLES.ADMIN ? "bg-primary/10 text-primary border border-primary/20" :
                            user.role === ROLES.STAFF ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    )}>
                        {user.role === ROLES.ADMIN ? <ShieldCheck className="h-6 w-6" /> :
                            user.role === ROLES.STAFF ? <Shield className="h-6 w-6" /> :
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
                        "px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[0.05em] w-fit uppercase flex items-center gap-1.5",
                        user.role === ROLES.ADMIN ? "bg-primary/10 text-primary border border-primary/20" :
                            user.role === ROLES.STAFF ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                "bg-white/5 text-white/50 border border-white/10"
                    )}>
                        <div className={cn("w-1.5 h-1.5 rounded-full",
                            user.role === ROLES.ADMIN ? "bg-primary" :
                                user.role === ROLES.STAFF ? "bg-amber-500" :
                                    "bg-white/20")} />
                        {user.role === ROLES.ADMIN ? "Admin Access" :
                            user.role === ROLES.STAFF ? "Staff Member" :
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
                    onMouseEnter={() => onPrefetch(String(user.pk))}
                >
                    <Button
                        variant="outline"
                        className="h-10 px-5 rounded-xl border-white/10 bg-white/5 text-white/70 hover:text-white hover:bg-primary hover:border-primary hover:text-background font-bold group/btn transition-all active:scale-95"
                    >
                        <span>MANAGE</span>
                        <ExternalLink className="ml-2 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                    </Button>
                </Link>
            </td>
        </motion.tr>
    );
}
