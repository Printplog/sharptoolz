import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
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
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-100">
                    <Shield className="h-5 w-5 text-amber-400" />
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
                        <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                            <Button
                                onClick={() => onUpdateRole(ROLES.STAFF)}
                                disabled={isUpdating || user.role === ROLES.STAFF}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "rounded-lg px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all",
                                    user.role === ROLES.STAFF
                                        ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                        : "text-white/30 hover:text-blue-400"
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
                                    "rounded-lg px-4 h-9 text-[11px] font-black uppercase tracking-wider transition-all",
                                    user.role === ROLES.STANDARD
                                        ? "bg-white/10 text-white shadow-lg"
                                        : "text-white/30 hover:text-white"
                                )}
                            >
                                Standard
                            </Button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full" />

                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-semibold text-white/70">Account Status</span>
                            <span className="text-xs text-white/40 italic">Active or restricted access</span>
                        </div>
                        <Button
                            onClick={onToggleStatus}
                            disabled={isUpdating}
                            className={cn(
                                "h-9 px-6 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all active:scale-95",
                                user.is_active
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500"
                                    : "bg-emerald-500 text-white border border-emerald-500 hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            )}
                        >
                            {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : (user.is_active ? "DEACTIVATE" : "ACTIVATE")}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
