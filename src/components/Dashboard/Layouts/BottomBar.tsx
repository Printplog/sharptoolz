import { useQuery } from "@tanstack/react-query";
import { FileText, Hammer, Home, MessagesSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { getFernwayAccounts, getTrackingSupportMessages } from "@/api/apiEndpoints";
import { getReferralStats } from "@/api/referralEndpoints";
import { BentoMenuIcon } from "@/components/Dashboard/Layouts/NavIcons";
import { REFERRALS_VISIBLE } from "@/lib/constants/features";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

const DRAWER_ONLY_PREFIXES = [
  "/sharp-guy",
  "/online-banking",
  "/wallet",
  "/referrals",
  "/settings",
  "/admin",
];

export default function BottomBar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { isOpen, toggle } = useSidebarStore();

  const { data: refStats } = useQuery({
    queryKey: ["referralStats"],
    queryFn: getReferralStats,
    enabled: !!user && REFERRALS_VISIBLE,
  });

  const { data: supportMessages } = useQuery({
    queryKey: ["support-messages"],
    queryFn: () => getTrackingSupportMessages(),
    enabled: !!user,
    staleTime: 30_000,
  });

  const { data: bankingSummary } = useQuery({
    queryKey: ["fernway-accounts"],
    queryFn: getFernwayAccounts,
    enabled: !!user,
    staleTime: 30_000,
    retry: false,
  });

  const unreadSupport = supportMessages?.unread_count ?? 0;
  const pendingBanking = bankingSummary?.pending_transfers_total ?? 0;
  const pendingReferrals = REFERRALS_VISIBLE ? (refStats?.pending_referrals ?? 0) : 0;
  const moreAlerts = pendingBanking + pendingReferrals;

  const isDrawerRouteActive = DRAWER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isMenuActive = isOpen || isDrawerRouteActive;

  const pinnedItems = [
    {
      label: "Home",
      to: "/dashboard",
      icon: <Home className="size-5" />,
      badge: 0,
    },
    {
      label: "Tools",
      to: "/tools",
      icon: <Hammer className="size-5" />,
      badge: 0,
    },
    {
      label: "Docs",
      to: "/documents",
      icon: <FileText className="size-5" />,
      badge: 0,
    },
    {
      label: "Support",
      to: "/support",
      icon: <MessagesSquare className="size-5" />,
      badge: unreadSupport,
    },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0c121b]/92 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center gap-1">
        {pinnedItems.map((item) => {
          const isActive =
            !isOpen && pathname.includes(item.to) && !pathname.startsWith("/admin/");

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-white/50 hover:text-white/85",
              )}
            >
              {isActive && (
                <span className="absolute top-0 h-[2px] w-6 rounded-full bg-primary" />
              )}
              <span className="relative flex items-center justify-center">
                {item.icon}
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-[#0b1118] ring-2 ring-[#0c121b]">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </span>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* 5th slot — Bespoke Bento Menu Drawer Trigger */}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close all menu" : "Open all tools and menu"}
          className={cn(
            "relative flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors",
            isMenuActive ? "text-primary" : "text-white/50 hover:text-white/85",
          )}
        >
          {isMenuActive && (
            <span className="absolute top-0 h-[2px] w-6 rounded-full bg-primary" />
          )}
          <span className="relative flex items-center justify-center">
            <BentoMenuIcon active={isMenuActive} />
            {moreAlerts > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-[#0b1118] ring-2 ring-[#0c121b]">
                {moreAlerts > 9 ? "9+" : moreAlerts}
              </span>
            )}
          </span>
          <span className="leading-none">Menu</span>
        </button>
      </div>
    </nav>
  );
}
