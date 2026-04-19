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
    active?: boolean;
}

function InfoTile({ label, value, icon: Icon, active }: InfoTileProps) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/8 group">
            <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center border transition-colors shrink-0",
                active ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white/30 group-hover:text-white/60"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate">
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
    const infoItems = [
        { label: "Email Address", value: user.email, icon: Mail },
        { label: "Account Role", value: user.role || "User", icon: Shield },
        { label: "Wallet Balance", value: `$${user.wallet_balance}`, icon: Wallet },
        { label: "Account Status", value: user.is_active ? "Active" : "Inactive", icon: Activity, active: user.is_active },
        { label: "Date Joined", value: formatAdminDate(user.date_joined, { month: 'long', day: 'numeric', year: 'numeric' }), icon: Calendar },
        { label: "User ID", value: `#${user.pk}`, icon: Fingerprint },
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
