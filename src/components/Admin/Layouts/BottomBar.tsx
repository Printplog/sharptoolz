import { LayoutDashboard, Hammer, Users, LayoutTemplate, Type, ArrowLeft, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    icon: LayoutDashboard,
    label: "Admin",
    to: "/admin/dashboard",
  },
  {
    icon: Hammer,
    label: "Tools",
    to: "/admin/tools",
  },
  {
    icon: LayoutTemplate,
    label: "Templates",
    to: "/admin/templates",
  },
  {
    icon: Type,
    label: "Fonts",
    to: "/admin/fonts",
  },
  {
    icon: Users,
    label: "Users",
    to: "/admin/users",
  },
  {
    icon: ArrowLeft,
    label: "User",
    to: "/dashboard",
  },
  {
    icon: Settings,
    label: "Settings",
    to: "/admin/settings",
  },
];

export default function BottomBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-background border-t border-white/10 flex justify-around items-center py-4 lg:hidden">
      {navigationItems.map((item) => {
        // Special handling for "Switch to User" link - only active if pathname is exactly /dashboard or starts with /dashboard/ (but not /admin/dashboard)
        let isActive = false;
        if (item.to === "/dashboard") {
          isActive = pathname === "/dashboard" || (pathname.startsWith("/dashboard/") && !pathname.startsWith("/admin/"));
        } else {
          // For admin routes, check if pathname includes the route (normal behavior)
          isActive = pathname.includes(item.to);
        }
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center text-xs text-muted-foreground hover:text-primary transition-all",
              isActive && "text-primary"
            )}
          >
            <Icon className="w-5 h-5 mb-[2px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
