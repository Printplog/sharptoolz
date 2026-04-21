import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Shield, Wallet, Activity, Calendar, Fingerprint } from "lucide-react";
import type { AdminUserDetails } from "@/types";
import { cn } from "@/lib/utils";
import { formatAdminDate } from "@/lib/utils/adminDate";

interface ProfileCardProps {
    user: AdminUserDetails["user"];
}

interface InfoTileProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    color?: "blue" | "green" | "purple" | "amber" | "indigo" | "slate" | "red";
    active?: boolean;
}

function InfoTile({ label, value, icon: Icon, color = "slate", active }: InfoTileProps) {
    const colorMap = {
        blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
        green: "bg-green-500/10 border-green-500/20 text-green-400",
        purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
        amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        indigo: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        slate: "bg-white/5 border-white/10 text-white/30",
        red: "bg-red-500/10 border-red-500/20 text-red-400",
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/8 group">
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border transition-all shrink-0 group-hover:scale-110 group-hover:rotate-3",
                colorMap[color]
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest truncate",
                    active ? "text-green-500" : "text-white/30"
                )}>
                    {label}
                </span>
                <span className="text-sm font-bold text-white truncate">
                    {value}
                </span>
            </div>
        </div>
    );
}

export default function ProfileCard({ user }: ProfileCardProps) {
    const infoItems: InfoTileProps[] = [
        { label: "Email Address", value: user.email, icon: Mail, color: "blue" },
        { 
            label: "Account Role", 
            value: user.role || "User", 
            icon: Shield, 
            color: user.role === "Admin" ? "amber" : user.role === "Staff" ? "purple" : "indigo" 
        },
        { label: "Wallet Balance", value: `$${user.wallet_balance}`, icon: Wallet, color: "green" },
        { 
            label: "Account Status", 
            value: user.is_active ? "Active" : "Inactive", 
            icon: Activity, 
            color: user.is_active ? "green" : "red",
            active: user.is_active 
        },
        { label: "Date Joined", value: formatAdminDate(user.date_joined, { month: 'long', day: 'numeric', year: 'numeric' }), icon: Calendar, color: "indigo" },
        { label: "User ID", value: `#${user.pk}`, icon: Fingerprint, color: "slate" },
    ];

    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                    <User className="h-3.5 w-3.5" />
                    Identity & Details
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {infoItems.map((item, idx) => (
                        <InfoTile key={idx} {...item} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
