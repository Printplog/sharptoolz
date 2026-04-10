import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Hammer,
  FileText,
  Settings,
  Wallet,
  ArrowRight,
  MessageSquare,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuthStore } from "@/store/authStore";
import useChatStore from "@/store/chatStore";
import { isAdminOrStaff } from "@/lib/constants/roles";

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sessions, currentSessionId, fetchSessions, newChat, loadSession } = useChatStore();

  const canAccessAdmin = isAdminOrStaff(user?.role);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: <img src="/sharpguy.png" className="h-4 w-4 object-contain" alt="Sharp Guy" />,
      label: "Sharp Guy",
      to: "/sharp-guy",
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
    ...(canAccessAdmin ? [{
      icon: <ArrowRight className="h-4 w-4" />,
      label: "Switch to Admin",
      to: "/admin/dashboard",
    }] : []),
  ];

  const handleSessionClick = (session: any) => {
    if (session.template) {
      navigate(`/tools/${session.template}?session_id=${session.id}`);
    } else if (session.purchased_template) {
      navigate(`/tools/${session.purchased_template}?session_id=${session.id}`);
    } else {
      navigate(`/sharp-guy?session_id=${session.id}`);
    }
    loadSession(session.id);
  };

  const handleNewChat = () => {
    newChat();
    navigate("/sharp-guy");
  };

  return (
    <aside
      className={cn(
        "w-64 bg-white/5 border-r border-white/10 h-full lg:flex hidden flex-col py-10"
      )}
    >
      {/* Header */}
      <div className="flex pl-6">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="space-y-0.5 mt-[20px] overflow-y-auto pr-2 px-2">
        {navigationItems.map((item) => {
          let isActive = false;
          if (item.to === "/admin/dashboard" || item.to.startsWith("/admin/")) {
            isActive = pathname.startsWith("/admin/");
          } else {
            isActive = pathname.includes(item.to) && !pathname.startsWith("/admin/");
          }

          return (
            <Link to={item.to} key={item.to} className="block">
              <button
                className={cn(
                  "w-full justify-start transition-colors py-2 px-4 flex items-center text-sm rounded-lg",
                  isActive
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
                )}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </button>
            </Link>
          );
        })}

        {/* Recent Chats Section */}
        <div className="mt-8 mb-2 px-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
            Recent Chats
          </span>
          <button 
            onClick={handleNewChat}
            className="p-1 hover:bg-white/10 rounded-md transition-colors text-foreground/40 hover:text-primary"
            title="New Global Chat"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="px-4 py-2 text-xs text-foreground/30 italic">
              No recent chats
            </div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session)}
                className={cn(
                  "w-full text-left py-2 px-4 flex items-center text-xs rounded-lg transition-all group",
                  currentSessionId === session.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/60 hover:bg-white/5 hover:text-foreground"
                )}
              >
                <MessageSquare className={cn(
                  "h-3 w-3 mr-2 shrink-0",
                  currentSessionId === session.id ? "text-primary" : "text-foreground/30 group-hover:text-foreground/60"
                )} />
                <span className="truncate flex-1">{session.title}</span>
              </button>
            ))
          )}
        </div>
      </nav>
    </aside>
  );
}
