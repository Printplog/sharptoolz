import { LayoutDashboard, Wallet, Settings, Hammer, ClipboardList, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function BottomBar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  
  // Check if user is admin
  const isAdmin = user?.role === "ZK7T-93XY" || user?.is_staff === true;

  const baseNavigationItems = [
    {
      icon: LayoutDashboard,
      label: "Home",
      to: "/dashboard",
    },
    {
      icon: Hammer,
      label: "Tools",
      to: "/tools",
    },
    {
      icon: ClipboardList,
      label: "Documents",
      to: "/documents",
    },
    {
      icon: Wallet,
      label: "Wallet",
      to: "/wallet",
    },
    {
      icon: Settings,
      label: "Settings",
      to: "/settings",
    },
  ];

  const adminNavigationItem = {
    icon: ArrowRight,
    label: "Admin",
    to: "/admin/dashboard",
  };

  const navigationItems = isAdmin 
    ? [...baseNavigationItems, adminNavigationItem]
    : baseNavigationItems;

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-background border-t border-white/10 flex justify-around items-center py-4 lg:hidden">
      {navigationItems.map((item) => {
        // Special handling for "Switch to Admin" link - only active if pathname starts with /admin/
        let isActive = false;
        if (item.to === "/admin/dashboard" || item.to.startsWith("/admin/")) {
          isActive = pathname.startsWith("/admin/");
        } else {
          // For user routes, check if pathname includes the route but not /admin/
          isActive = pathname.includes(item.to) && !pathname.startsWith("/admin/");
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
