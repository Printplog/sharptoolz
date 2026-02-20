import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, Download } from "lucide-react";
import type { AdminUserDetails } from "@/types";

interface WalletActivityProps {
    user: AdminUserDetails["user"];
}

export default function WalletActivity({ user }: WalletActivityProps) {
    return (
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-100">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    Wallet & Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Wallet className="h-5 w-5 text-green-300" />
                        </div>
                        <div className="text-2xl font-bold text-green-300 mb-1">
                            ${user.wallet_balance}
                        </div>
                        <div className="text-sm text-green-200/70">Wallet Balance</div>
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <DollarSign className="h-5 w-5 text-blue-300" />
                        </div>
                        <div className="text-2xl font-bold text-blue-300 mb-1">
                            {user.total_purchases}
                        </div>
                        <div className="text-sm text-blue-200/70">Total Purchases</div>
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Download className="h-5 w-5 text-purple-300" />
                        </div>
                        <div className="text-2xl font-bold text-purple-300 mb-1">
                            {user.downloads}
                        </div>
                        <div className="text-sm text-purple-200/70">Downloads</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
