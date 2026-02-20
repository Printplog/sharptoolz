import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail } from "lucide-react";
import type { AdminUserDetails } from "@/types";

interface ProfileCardProps {
    user: AdminUserDetails["user"];
}

export default function ProfileCard({ user }: ProfileCardProps) {
    return (
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-100">
                    <User className="h-5 w-5 text-blue-400" />
                    User Profile
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/30 to-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                        <User className="h-8 w-8 text-blue-300" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                            {user.username}
                        </h3>
                        <div className="flex items-center gap-2 text-blue-200">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
