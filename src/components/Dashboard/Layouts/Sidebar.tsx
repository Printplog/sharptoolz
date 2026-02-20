import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Hammer,
  FileText,
  Settings,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/store/authStore";
import { isAdminOrStaff } from "@/lib/constants/roles";

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const canAccessAdmin = isAdminOrStaff(user?.role);

  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: <Hammer className="h-4 w-4" />,
      label: "All Tools",
      to: "/tools",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Documents",
      to: "/documents",
    },
    {
      icon: <Wallet className="h-4 w-4" />,
      label: "Wallet",
      to: "/wallet",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      to: "/settings",
    },
    // Add Admin link if user is admin
    ...(canAccessAdmin ? [{
      icon: <ArrowRight className="h-4 w-4" />,
      label: "Switch to Admin",
      to: "/admin/dashboard",
    }] : []),
  ];

  return (
    <aside
      className={cn(
        "w-64 bg-white/5 border-r border-white/10 h-full lg:flex hidden flex-col py-10 z-[]"
      )}
    >
      {/* Header */}
      <div className="flex pl-6">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 mt-[20px] overflow-y-auto custom-scrollbar pr-2">
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
            <div className="" key={item.to}>
              <Link to={item.to}>
                <button
                  className={cn(
                    "w-full justify-start transition-colors py-2 px-6 flex items-center text-sm",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/10 border-r-2 border-primary"
                      : "text-foreground hover:bg-primary/5 hover:text-primary/90"
                  )}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </button>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
