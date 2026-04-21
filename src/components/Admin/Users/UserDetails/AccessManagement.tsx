import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield,  UserCheck, UserMinus } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { cn } from "@/lib/utils";
import { ROLES } from "@/lib/constants/roles";
import type { AdminUserDetails } from "@/types";

interface AccessManagementProps {
    user: AdminUserDetails["user"];
    isUpdating: boolean;
    onUpdateRole: (newRole: string) => void;
    onToggleStatus: () => void;
}

export default function AccessManagement({
    user,
    isUpdating,
    onUpdateRole,
    onToggleStatus,
}: AccessManagementProps) {
    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full rounded-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                    <Shield className="h-3.5 w-3.5" />
                    Access Management
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-white/70">Account Role</span>
                            <span className="text-xs text-white/40 italic">Determines permission level</span>
                        </div>
                        <div className="flex bg-black/20 p-1 rounded-full border border-white/5">
                            <Button
                                onClick={() => onUpdateRole(ROLES.STAFF)}
                                disabled={isUpdating || user.role === ROLES.STAFF}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all border border-transparent",
                                    user.role === ROLES.STAFF
                                        ? "bg-blue-500 text-white"
                                        : "text-white/30 hover:text-blue-400 hover:border-blue-500/30"
                                )}
                            >
                                Staff
                            </Button>
                            <Button
                                onClick={() => onUpdateRole(ROLES.STANDARD)}
                                disabled={isUpdating || user.role === ROLES.STANDARD}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-full px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all border border-transparent",
                                    user.role === ROLES.STANDARD
                                        ? "bg-white/10 text-white"
                                        : "text-white/30 hover:text-white hover:border-white/20"
                                )}
                            >
                                Standard
                            </Button>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 my-6" />

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-white/70">Account Status</span>
                            <span className="text-xs text-white/40 italic">Active or restricted access</span>
                        </div>
                        <PremiumButton
                            onClick={onToggleStatus}
                            isLoading={isUpdating}
                            text={user.is_active ? "DEACTIVATE USER" : "ACTIVATE USER"}
                            icon={user.is_active ? UserMinus : UserCheck}
                            className={cn(
                                "h-11 px-8 rounded-full font-black text-[11px] uppercase tracking-widest transition-all border-0 shadow-none",
                                user.is_active
                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
