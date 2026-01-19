import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Hammer,
  Users,
  LayoutTemplate,
  Type,
  Settings,
  ArrowLeft,
  LineChart,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useQueryClient } from "@tanstack/react-query";
import { adminOverview, getAdminAnalytics, adminUsers } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";

export default function Sidebar() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const handlePrefetch = (to: string) => {
    switch (to) {
      case "/admin/dashboard":
        queryClient.prefetchQuery({ queryKey: ["adminOverview"], queryFn: adminOverview });
        break;
      case "/admin/analytics":
        queryClient.prefetchQuery({ queryKey: ["adminAnalytics"], queryFn: getAdminAnalytics });
        break;
      case "/admin/users":
        queryClient.prefetchQuery({
          queryKey: ["adminUsers", { page: 1, page_size: 10, search: "" }],
          queryFn: () => adminUsers({ page: 1, page_size: 10, search: "" })
        });
        break;
    }
  };

  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      to: "/admin/dashboard",
    },
    {
      icon: <LineChart className="h-5 w-5" />,
      label: "Analytics",
      to: "/admin/analytics",
    },
    {
      icon: <ShieldAlert className="h-5 w-5" />,
      label: "Logs",
      to: "/admin/audit-logs",
    },
    {
      icon: <Hammer className="h-5 w-5" />,
      label: "Tools",
      to: "/admin/tools",
    },
    {
      icon: <LayoutTemplate className="h-5 w-5" />,
      label: "Templates",
      to: "/admin/templates",
    },
    {
      icon: <Type className="h-5 w-5" />,
      label: "Fonts",
      to: "/admin/fonts",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      to: "/admin/users",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      to: "/admin/settings",
    },
    {
      icon: <ArrowLeft className="h-5 w-5" />,
      label: "Switch to User",
      to: "/dashboard",
    },
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
      <nav className="flex-1 space-y-2 mt-[40px]">
        {navigationItems.filter(item => {
          // Strict Role check
          const role = user?.role;
          const isStaff = role === "S9K3-41TV";
          const isAdmin = role === "ZK7T-93XY";

          // 1. Staff: ALLOW-LIST only
          if (isStaff) {
            const allowedForStaff = ["Dashboard", "Tools", "Templates", "Fonts", "Switch to User"];
            return allowedForStaff.includes(item.label);
          }

          // 2. Admin: SHOW ALL
          if (isAdmin) {
            return true;
          }

          // 3. Others (Standard): Hide Admin links
          // Standard users shouldn't be here, but just in case
          const restrictedForUser = ["Users", "Analytics", "Settings", "Tools", "Templates", "Fonts"];
          return !restrictedForUser.includes(item.label);

        }).map((item) => {
          // Special handling for "Switch to User" link - only active if pathname is exactly /dashboard or starts with /dashboard/ (but not /admin/dashboard)
          let isActive = false;
          if (item.to === "/dashboard") {
            isActive = pathname === "/dashboard" || (pathname.startsWith("/dashboard/") && !pathname.startsWith("/admin/"));
          } else {
            // For admin routes, check if pathname includes the route (normal behavior)
            isActive = pathname.includes(item.to);
          }

          return (
            <div key={item.to}>
              <Link
                to={item.to}
                onMouseEnter={() => handlePrefetch(item.to)}
              >
                <button
                  className={cn(
                    "w-full justify-start transition-colors py-3 px-6 flex items-center",
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