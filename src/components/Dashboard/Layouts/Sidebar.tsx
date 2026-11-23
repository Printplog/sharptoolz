import { useCallback, useEffect, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Hammer,
  FileText,
  Landmark,
  Settings,
  Wallet,
  ArrowRight,
  MessageSquare,
  MessagesSquare,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { getFernwayAccounts, getSiteSettings, getTrackingSupportMessages } from "@/api/apiEndpoints";
import { getReferralStats } from "@/api/referralEndpoints";
import Logo from "@/components/Logo";
import { useSupportRealtime } from "@/hooks/useSupportRealtime";
import { REFERRALS_VISIBLE } from "@/lib/constants/features";
import { isAdminOrStaff } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import useChatStore, { type ChatSession } from "@/store/chatStore";
import { useSidebarStore } from "@/store/sidebarStore";

interface NavItem {
  icon: ReactNode;
  label: string;
  to: string;
  badge?: number;
  badgeTone?: "primary" | "amber";
  pulseBadge?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sessions, currentSessionId, fetchSessions, newChat, loadSession } = useChatStore();
  const { isOpen, isCollapsed, toggleCollapsed, close } = useSidebarStore();

  const { data: settings } = useQuery({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

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

  const queryClient = useQueryClient();
  const refreshSupport = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["support-messages"] });
  }, [queryClient]);
  const refreshBanking = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["fernway-account"] });
  }, [queryClient]);

  useSupportRealtime({
    config: supportMessages?.realtime,
    channel: supportMessages?.channel,
    onUpdate: refreshSupport,
    onBankingUpdate: refreshBanking,
  });

  const canAccessAdmin = isAdminOrStaff(user?.role);
  const aiEnabled = settings?.enable_ai_features ?? true;

  useEffect(() => {
    if (user && aiEnabled) {
      fetchSessions();
    }
  }, [user, fetchSessions, aiEnabled]);

  // Close mobile drawer on route change
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const navGroups: NavGroup[] = [
    {
      id: "overview",
      title: "Overview",
      items: [
        {
          icon: <LayoutDashboard className="size-4" />,
          label: "Dashboard",
          to: "/dashboard",
        },
        ...(aiEnabled
          ? [
              {
                icon: <img src="/sharpguy.png" className="size-4 object-contain" alt="Sharp Guy" />,
                label: "Sharp Guy",
                to: "/sharp-guy",
              },
            ]
          : []),
      ],
    },
    {
      id: "workspace",
      title: "Tools & Workspace",
      items: [
        {
          icon: <Hammer className="size-4" />,
          label: "All Tools",
          to: "/tools",
        },
        {
          icon: <FileText className="size-4" />,
          label: "Documents",
          to: "/documents",
        },
        {
          icon: <Landmark className="size-4" />,
          label: "Online Banking",
          to: "/online-banking",
          badge: bankingSummary?.pending_transfers_total ?? 0,
          badgeTone: "amber",
        },
        {
          icon: <MessagesSquare className="size-4" />,
          label: "Support Messages",
          to: "/support",
          badge: supportMessages?.unread_count ?? 0,
          badgeTone: "primary",
        },
      ],
    },
    {
      id: "account",
      title: "Account",
      items: [
        {
          icon: <Wallet className="size-4" />,
          label: "Wallet",
          to: "/wallet",
        },
        ...(REFERRALS_VISIBLE
          ? [
              {
                icon: <Users className="size-4" />,
                label: "Refer & Earn",
                to: "/referrals",
                badge: refStats?.pending_referrals ?? 0,
                badgeTone: "primary" as const,
                pulseBadge: true,
              },
            ]
          : []),
        {
          icon: <Settings className="size-4" />,
          label: "Settings",
          to: "/settings",
        },
        ...(canAccessAdmin
          ? [
              {
                icon: <ArrowRight className="size-4" />,
                label: "Switch to Admin",
                to: "/admin/dashboard",
              },
            ]
          : []),
      ],
    },
  ];

  const handleSessionClick = (session: ChatSession) => {
    if (session.template) {
      navigate(`/tools/${session.template}?session_id=${session.id}`);
    } else if (session.purchased_template) {
      navigate(`/tools/${session.purchased_template}?session_id=${session.id}`);
    } else {
      navigate(`/sharp-guy?session_id=${session.id}`);
    }
    loadSession(session.id);
    close();
  };

  const handleNewChat = () => {
    newChat();
    navigate("/sharp-guy");
    close();
  };

  const renderSidebarBody = (compact: boolean, isMobileDrawer: boolean) => (
    <>
      {/* Brand header */}
      <div
        className={cn(
          "flex items-center px-5 pt-6 pb-4",
          compact ? "justify-center px-0" : "justify-between",
        )}
      >
        <Logo showText={!compact} size={compact ? 28 : 30} />
        {isMobileDrawer && (
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation menu"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-2.5 pb-6">
        <div className="space-y-5">
          {navGroups.map((group, groupIndex) => (
            <div key={group.id}>
              {!compact ? (
                <div className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.12em] text-white/35 uppercase">
                  {group.title}
                </div>
              ) : (
                groupIndex > 0 && <div className="mx-3 my-3 h-px bg-white/[0.08]" />
              )}

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.to === "/admin/dashboard" || item.to.startsWith("/admin/")
                      ? pathname.startsWith("/admin/")
                      : pathname.includes(item.to) && !pathname.startsWith("/admin/");
                  const count = item.badge ?? 0;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        if (isMobileDrawer) close();
                      }}
                      title={compact ? item.label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center rounded-xl text-[13.5px] font-medium transition-colors",
                        compact ? "mx-auto size-10 justify-center px-0" : "gap-3 px-3 py-2.5",
                        isActive
                          ? "bg-primary/[0.12] text-primary"
                          : "text-white/68 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      {isActive && !compact && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
                      )}

                      <span className="relative flex shrink-0 items-center justify-center">
                        {item.icon}
                        {compact && count > 0 && (
                          <span
                            className={cn(
                              "absolute -top-1.5 -right-1.5 size-2 rounded-full ring-2 ring-[#0d131c]",
                              item.badgeTone === "amber" ? "bg-amber-400" : "bg-primary",
                            )}
                          />
                        )}
                      </span>

                      {!compact && <span className="flex-1 truncate">{item.label}</span>}

                      {!compact && count > 0 && (
                        <span
                          className={cn(
                            "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-[#0b1118]",
                            item.badgeTone === "amber" ? "bg-amber-400" : "bg-primary",
                            item.pulseBadge && "animate-pulse",
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Chats Section */}
        {aiEnabled && !compact && (
          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-white/35 uppercase">
                Recent Chats
              </span>
              <button
                type="button"
                onClick={handleNewChat}
                className="flex size-6 cursor-pointer items-center justify-center rounded-lg text-white/45 transition-colors hover:bg-white/10 hover:text-primary"
                title="New Global Chat"
                aria-label="Start new Sharp Guy chat"
              >
                <Plus className="size-3.5" />
              </button>
            </div>

            <div className="max-h-[240px] space-y-0.5 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/30">No recent chats yet</div>
              ) : (
                sessions.map((session) => {
                  const isCurrent = currentSessionId === session.id;
                  return (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() => handleSessionClick(session)}
                      className={cn(
                        "group relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors",
                        isCurrent
                          ? "bg-primary/[0.12] text-primary"
                          : "text-white/58 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "size-3.5 shrink-0",
                          isCurrent ? "text-primary" : "text-white/30 group-hover:text-white/60",
                        )}
                      />
                      <span className="flex-1 truncate">{session.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile & Tablet Slide-Out Drawer (< lg) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={close}
              className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Mobile sidebar"
              className="fixed inset-y-0 left-0 z-[110] flex h-full w-[288px] max-w-[84vw] flex-col border-r border-white/[0.09] bg-[#0d131c] shadow-2xl lg:hidden"
            >
              {renderSidebarBody(false, true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Collapsible Sidebar (lg+) */}
      <aside
        className={cn(
          "relative z-[60] hidden h-full shrink-0 flex-col border-r border-white/[0.08] bg-[#0d131c]/95 transition-[width] duration-300 ease-out lg:flex",
          isCollapsed ? "w-[76px]" : "w-[260px]",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-7 -right-3 z-[70] flex size-6 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-[#111926] text-white/60 shadow-md transition-colors hover:border-primary/40 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </button>

        {renderSidebarBody(isCollapsed, false)}
      </aside>
    </>
  );
}
