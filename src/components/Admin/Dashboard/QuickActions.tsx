import { Link } from "react-router-dom";
import { 
  Type, 
  LayoutTemplate, 
  Hammer, 
  ExternalLink, 
  ChevronRight, 
  Users, 
  FileText,
  LineChart,
  Activity,
  type LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
  target?: string;
}

export default function QuickActions() {
    const actions: QuickAction[] = [
        {
            title: "Users",
            description: "Manage user accounts",
            icon: Users,
            href: "/admin/users",
            gradient: "from-indigo-500/20 to-indigo-600/5",
            borderColor: "border-indigo-500/20",
            iconColor: "text-indigo-400",
        },
        {
            title: "Templates",
            description: "Manage SVG templates",
            icon: LayoutTemplate,
            href: "/admin/templates",
            gradient: "from-blue-500/20 to-blue-600/5",
            borderColor: "border-blue-500/20",
            iconColor: "text-blue-400",
        },
        {
            title: "Purchased Templates",
            description: "View user documents",
            icon: FileText,
            href: "/admin/documents",
            gradient: "from-rose-500/20 to-rose-600/5",
            borderColor: "border-rose-500/20",
            iconColor: "text-rose-400",
        },
        {
            title: "Traffic Sources",
            description: "Live traffic telemetry",
            icon: LineChart,
            href: "/admin/traffic-sources",

            gradient: "from-cyan-500/20 to-cyan-600/5",
            borderColor: "border-cyan-500/20",
            iconColor: "text-cyan-400",
        },
        {
            title: "User Activity",
            description: "Real-time monitoring",
            icon: Activity,
            href: "/admin/user-activity",
            gradient: "from-emerald-500/20 to-emerald-600/5",
            borderColor: "border-emerald-500/20",
            iconColor: "text-emerald-400",
        },
        {
            title: "Tools",
            description: "Manage platform tools",
            icon: Hammer,
            href: "/admin/tools",
            gradient: "from-amber-500/20 to-amber-600/5",
            borderColor: "border-amber-500/20",
            iconColor: "text-amber-400",
        },
        {
            title: "Fonts",
            description: "Manage system fonts",
            icon: Type,
            href: "/admin/fonts",
            gradient: "from-purple-500/20 to-purple-600/5",
            borderColor: "border-purple-500/20",
            iconColor: "text-purple-400",
        },
        {
            title: "Main Site",
            description: "View user dashboard",
            icon: ExternalLink,
            href: "/dashboard",
            gradient: "from-green-500/20 to-green-600/5",
            borderColor: "border-green-500/20",
            iconColor: "text-green-400",
            target: "_blank",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-white uppercase italic tracking-tighter">
                    Admin <span className="text-primary">Quick Actions</span> ⚡
                </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {actions.map((action) => (
                    <Link
                        key={action.href}
                        to={action.href}
                        target={action.target}
                        rel={action.target === "_blank" ? "noopener noreferrer" : undefined}
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
