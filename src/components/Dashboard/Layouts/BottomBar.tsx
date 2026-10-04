import { LayoutDashboard, Wallet, Settings, Hammer, ClipboardList, ArrowRight, Users, MessagesSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, getTrackingSupportMessages } from "@/api/apiEndpoints";
import { getReferralStats } from "@/api/referralEndpoints";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { isAdminOrStaff } from "@/lib/constants/roles";

export default function BottomBar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  const { data: refStats } = useQuery({
    queryKey: ["referralStats"],
    queryFn: getReferralStats,
    enabled: !!user,
  });

  const { data: supportMessages } = useQuery({
    queryKey: ["support-messages"],
    queryFn: getTrackingSupportMessages,
    enabled: !!user,
    staleTime: 30_000,
  });

  const canAccessAdmin = isAdminOrStaff(user?.role);
  const aiEnabled = settings?.enable_ai_features ?? true;

  const baseNavigationItems = [
    {
      icon: <LayoutDashboard className="w-5 h-5 mb-[2px]" />,
      label: "Home",
      to: "/dashboard",
    },
    ...(aiEnabled ? [{
      icon: <img src="/sharpguy.png" className="w-5 h-5 mb-[2px] object-contain" alt="Sharp Guy" />,
      label: "Sharp Guy",
      to: "/sharp-guy",
    }] : []),
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
      icon: <MessagesSquare className="w-5 h-5 mb-[2px]" />,
      label: "Support",
      to: "/support",
      badge: supportMessages?.unread_count ?? 0,
    },
    {
      icon: <Wallet className="w-5 h-5 mb-[2px]" />,
      label: "Wallet",
      to: "/wallet",
    },
    {
      icon: <Users className="w-5 h-5 mb-[2px]" />,
      label: "Refer",
      to: "/referrals",
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
    <nav className="fixed bottom-0 z-50 flex w-full items-center justify-start overflow-x-auto border-t border-white/10 bg-background py-4 lg:hidden">
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
              "flex min-w-[68px] flex-1 flex-col items-center text-xs text-muted-foreground hover:text-primary transition-all",
              isActive && "text-primary"
            )}
          >
            <div className="relative">
              {item.icon}
              {item.to === "/referrals" && refStats && refStats.pending_referrals > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-black text-black animate-pulse">
                  {refStats.pending_referrals}
                </span>
              )}
              {item.to === "/support" && "badge" in item && typeof item.badge === "number" && item.badge > 0 && (
                <span className="absolute -right-2 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-black text-black">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
