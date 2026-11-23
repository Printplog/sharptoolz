import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { getFernwayAccounts, getTrackingSupportMessages } from "@/api/apiEndpoints";
import { SharpMenuIcon } from "@/components/Dashboard/Layouts/NavIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

function resolveSectionTitle(pathname: string): string {
  if (pathname.startsWith("/sharp-guy")) return "Sharp Guy";
  if (pathname.startsWith("/tools")) return "Tools";
  if (pathname.startsWith("/documents")) return "Documents";
  if (pathname.startsWith("/online-banking")) return "Online Banking";
  if (pathname.startsWith("/support")) return "Support";
  if (pathname.startsWith("/wallet")) return "Wallet";
  if (pathname.startsWith("/referrals")) return "Refer & Earn";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Dashboard";
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const { logout, isPending } = useLogout();
  const { isOpen, toggle } = useSidebarStore();

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

  const hasSidebarAlerts =
    (supportMessages?.unread_count ?? 0) > 0 || (bankingSummary?.pending_transfers_total ?? 0) > 0;
  const pageTitle = resolveSectionTitle(pathname);
  const avatarInitial = (user?.username?.[0] || "U").toUpperCase();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/[0.08] bg-[#0f1620]/85 px-4 py-3 backdrop-blur-2xl md:px-6 md:py-3.5">
      {/* Left Side — Bespoke Menu Trigger + Active Title (< lg) / Greeting (lg+) */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Close menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          className={cn(
            "relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-all lg:hidden",
            isOpen
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-white/[0.1] bg-white/[0.04] text-white/85 hover:border-white/20 hover:bg-white/[0.08] hover:text-white",
          )}
        >
          <SharpMenuIcon open={isOpen} />
          {!isOpen && hasSidebarAlerts && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-[#0f1620]" />
          )}
        </button>

        <div className="min-w-0 lg:hidden">
          <h1 className="truncate font-[family-name:var(--font-fancy)] text-[17px] leading-tight font-semibold tracking-[-0.015em] text-white">
            {pageTitle}
          </h1>
        </div>

        <div className="hidden lg:block">
          <h2 className="text-xl font-bold tracking-tight text-white italic italic-primary">
            Hey <span className="text-primary">{user?.username || "Value Visitor"}</span> 👋
          </h2>
        </div>
      </div>

      {/* Right Side — User Menu */}
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <button
              type="button"
              aria-label="Account menu"
              className="flex size-9 items-center justify-center rounded-full bg-primary text-base font-bold text-background transition-transform hover:scale-105 md:size-10 md:text-lg"
            >
              {avatarInitial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/15 bg-[#0d131c] text-white">
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white">
              <Link to="/" className="flex items-center">
                <LayoutDashboard className="mr-2 size-4 text-primary" />
                <span>View Main Site</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              disabled={isPending}
            >
              <LogOut className="mr-2 size-4 text-primary" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
