import { useState } from 'react';
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
  FileText,
  Wallet,
  ArrowLeftRight,
  ChevronDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useQueryClient } from "@tanstack/react-query";
import { adminOverview, getAdminAnalytics, adminUsers } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { ROLES } from "@/lib/constants/roles";
import { Button } from '@/components/ui/button';

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  submenu?: { label: string; to: string }[];
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isCollapsed, toggleCollapsed } = useSidebarStore();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const defaultDays = 1;

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev: Record<string, boolean>) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const handlePrefetch = (to: string) => {
    switch (to) {
      case "/admin/dashboard":
        queryClient.prefetchQuery({ queryKey: ["adminOverview", defaultDays], queryFn: () => adminOverview(defaultDays) });
        break;
      case "/admin/analytics":
        queryClient.prefetchQuery({ queryKey: ["adminAnalytics", defaultDays], queryFn: () => getAdminAnalytics(defaultDays) });
        break;
      case "/admin/users":
        queryClient.prefetchQuery({
          queryKey: ["adminUsers", { page: 1, page_size: 10, search: "" }],
          queryFn: () => adminUsers({ page: 1, page_size: 10, search: "" })
        });
        break;
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      to: "/admin/dashboard",
    },
    {
      icon: <LineChart className="h-4 w-4" />,
      label: "Analytics",
      to: "/admin/analytics",
    },
    {
      icon: <ShieldAlert className="h-4 w-4" />,
      label: "Logs",
      to: "/admin/audit-logs",
    },
    {
      icon: <Hammer className="h-4 w-4" />,
      label: "Tools",
      to: "/admin/tools",
    },
    {
      icon: <LayoutTemplate className="h-4 w-4" />,
      label: "Templates",
      to: "/admin/templates",
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: "Purchased Templates",
      to: "/admin/documents",
    },
    {
      icon: <Type className="h-4 w-4" />,
      label: "Fonts",
      to: "/admin/fonts",
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      label: "Docs",
      to: "/admin/docs",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Users",
      to: "/admin/users",
    },
    {
      icon: <Wallet className="h-4 w-4" />,
      label: "Wallets",
      to: "/admin/wallet",
    },
    {
      icon: <ArrowLeftRight className="h-4 w-4" />,
      label: "Transactions",
      to: "/admin/transactions",
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: "Settings",
      to: "/admin/settings",
    },
    {
      icon: <ArrowLeft className="h-4 w-4" />,
      label: "Switch to User",
      to: "/dashboard",
    },
  ];

  return (
    <aside
      className={cn(
        "bg-white/5 border-r border-white/10 h-full lg:flex hidden flex-col py-10 z-10 transition-all duration-500 ease-in-out relative",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className="absolute -right-3 top-12 size-6 rounded-full border border-white/10 bg-[#0A0A0B] text-white/60 hover:text-white hover:bg-white/10 z-20 transition-all duration-300"
      >
        {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
      </Button>

      {/* Header */}
      <div className={cn(
        "flex transition-all duration-500 px-6",
        isCollapsed ? "justify-center px-0" : "justify-start"
      )}>
        <Logo showText={!isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 mt-[20px] overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
        {navigationItems.filter(item => {
          const role = user?.role;
          const isStaff = role === ROLES.STAFF;
          const isAdmin = role === ROLES.ADMIN;

          if (isStaff) {
            const allowedForStaff = ["Dashboard", "Tools", "Templates", "Fonts", "Purchased Templates", "Switch to User", "Docs"];
            return allowedForStaff.includes(item.label);
          }
          if (isAdmin) return true;

          const restrictedForUser = ["Users", "Analytics", "Settings", "Tools", "Templates", "Fonts", "Logs"];
          return !restrictedForUser.includes(item.label);

        }).map((item) => {
          let isActive = false;
          if (item.to === "/dashboard") {
            isActive = pathname === "/dashboard" || (pathname.startsWith("/dashboard/") && !pathname.startsWith("/admin/"));
          } else {
            isActive = pathname.includes(item.to);
          }

          return (
            <div key={item.to}>
              {item.submenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.to)}
                    className={cn(
                      "w-full transition-all duration-300 py-2 flex items-center text-sm",
                      isCollapsed ? "justify-center px-0" : "justify-between px-6",
                      pathname.startsWith(item.to)
                        ? "!rounded-none bg-primary/10 text-primary hover:bg-primary/10"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                    title={isCollapsed ? item.label : ""}
                  >
                    <div className="flex items-center">
                      <div className={cn("transition-all duration-300", isCollapsed ? "scale-110" : "")}>
                        {item.icon}
                      </div>
                      {!isCollapsed && <span className="ml-2 animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 transition-transform duration-300",
                          expandedMenus[item.to] && "rotate-180"
                        )}
                      />
                    )}
                  </button>
                  {expandedMenus[item.to] && !isCollapsed && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      {item.submenu.map((subitem) => (
                        <Link key={subitem.to} to={subitem.to}>
                          <button
                            className={cn(
                              "w-full justify-start transition-colors py-1.5 px-4 flex items-center text-xs",
                              pathname === subitem.to
                                ? "!rounded-none text-primary"
                                : "text-white/60 hover:text-white"
                            )}
                          >
                            {subitem.label}
                          </button>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={item.to}
                  onMouseEnter={() => handlePrefetch(item.to)}
                >
                  <button
                    className={cn(
                      "w-full transition-all duration-300 py-2 flex items-center text-sm relative group",
                      isCollapsed ? "justify-center px-0" : "justify-start px-6",
                      isActive
                        ? "!rounded-none bg-primary/10 text-primary hover:bg-primary/10"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                    title={isCollapsed ? item.label : ""}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] animate-in fade-in duration-500" />
                    )}
                    <div className={cn("transition-all duration-300", isCollapsed ? "scale-110 group-hover:scale-125" : "")}>
                      {item.icon}
                    </div>
                    {!isCollapsed && (
                      <span className="ml-2 truncate animate-in fade-in slide-in-from-left-2 duration-300">
                        {item.label}
                      </span>
                    )}
                  </button>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
