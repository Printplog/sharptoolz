import { Link } from "react-router-dom";
import { FileText, Wallet, Settings, Package } from "lucide-react";

export default function QuickActions() {
    const actions = [
        {
            title: "My Documents",
            description: "View and manage your documents",
            icon: FileText,
            href: "/documents",
            color: "from-blue-500/20 to-blue-600/20",
            iconColor: "text-blue-400",
        },
        {
            title: "All Tools",
            description: "Browse all available templates",
            icon: Package,
            href: "/all-tools",
            color: "from-purple-500/20 to-purple-600/20",
            iconColor: "text-purple-400",
        },
        {
            title: "Wallet",
            description: "Manage your balance",
            icon: Wallet,
            href: "/wallet",
            color: "from-green-500/20 to-green-600/20",
            iconColor: "text-green-400",
        },
        {
            title: "Settings",
            description: "Update your preferences",
            icon: Settings,
            href: "/settings",
            color: "from-orange-500/20 to-orange-600/20",
            iconColor: "text-orange-400",
        },
    ];

    return (
        <div className="space-y-5">
            <h2 className="text-xl pb-3 border-b border-white/10">Quick Actions ⚡</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.href}
                            to={action.href}
                            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                            <div className="relative z-10 flex flex-col gap-3">
                                <div className={`w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center ${action.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{action.title}</h3>
                                    <p className="text-white/60 text-sm mt-1">{action.description}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
