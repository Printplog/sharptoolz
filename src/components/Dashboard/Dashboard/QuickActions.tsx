import { Link } from "react-router-dom";
import { FileText, Wallet, Settings, Package, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}

export default function QuickActions() {
    const actions: QuickAction[] = [
        {
            title: "My Documents",
            description: "View and manage your documents",
            icon: FileText,
            href: "/documents",
            gradient: "from-blue-500/20 to-blue-600/5",
            borderColor: "border-blue-500/20",
            iconColor: "text-blue-400",
        },
        {
            title: "All Tools",
            description: "Browse all available templates",
            icon: Package,
            href: "/all-tools",
            gradient: "from-purple-500/20 to-purple-600/5",
            borderColor: "border-purple-500/20",
            iconColor: "text-purple-400",
        },
        {
            title: "Wallet",
            description: "Manage your balance",
            icon: Wallet,
            href: "/wallet",
            gradient: "from-green-500/20 to-green-600/5",
            borderColor: "border-green-500/20",
            iconColor: "text-green-400",
        },
        {
            title: "Settings",
            description: "Update your preferences",
            icon: Settings,
            href: "/settings",
            gradient: "from-orange-500/20 to-orange-600/5",
            borderColor: "border-orange-500/20",
            iconColor: "text-orange-400",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                    Quick <span className="text-primary">Actions</span> ⚡
                </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {actions.map((action) => (
                    <Link
                        key={action.href}
                        to={action.href}
                        className={cn(
                            "group relative overflow-hidden bg-gradient-to-br border rounded-2xl p-4 backdrop-blur-md transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5",
                            action.gradient,
                            action.borderColor
                        )}
                    >
                        {/* Background Decorative Icon */}
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                            <action.icon size={60} />
                        </div>

                        <div className="relative z-10 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl bg-white/10 border border-white/10 shadow-inner flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
                                    action.iconColor
                                )}>
                                    <action.icon className="h-4 w-4" />
                                </div>
                                
                                <div className="truncate">
                                    <h3 className="text-white font-bold text-sm tracking-tight">{action.title}</h3>
                                    <p className="text-white/40 text-[10px] mt-0.5 font-medium leading-tight truncate">
                                        {action.description}
                                    </p>
                                </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
