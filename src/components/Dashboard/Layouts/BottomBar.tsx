import { LayoutDashboard, Wallet, Settings, Hammer, ClipboardList, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { isAdminOrStaff } from "@/lib/constants/roles";

export default function BottomBar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const canAccessAdmin = isAdminOrStaff(user?.role);

  const baseNavigationItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5 mb-[2px]" />,
      label: "Home",
      to: "/dashboard",
    },
    {
      icon: <img src="/sharpguy.png" className="w-5 h-5 mb-[2px] object-contain" alt="Sharp Guy" />,
      label: "Sharp Guy",
      to: "/sharp-guy",
    },
    {
      icon: <Hammer className="w-5 h-5 mb-[2px]" />,
      label: "Tools",
      to: "/tools",
    },
    {
      icon: <ClipboardList className="w-5 h-5 mb-[2px]" />,
      label: "Documents",
      to: "/documents",
    },
    {
      icon: <Wallet className="w-5 h-5 mb-[2px]" />,
      label: "Wallet",
      to: "/wallet",
    },
    {
      icon: <Settings className="w-5 h-5 mb-[2px]" />,
      label: "Settings",
      to: "/settings",
    },
  ];

  const adminNavigationItem = {
    icon: <ArrowRight className="w-5 h-5 mb-[2px]" />,
    label: "Admin",
    to: "/admin/dashboard",
  };

  const navigationItems = canAccessAdmin
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

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center text-xs text-muted-foreground hover:text-primary transition-all",
              isActive && "text-primary"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
