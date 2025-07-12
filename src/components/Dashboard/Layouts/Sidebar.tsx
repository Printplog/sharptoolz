import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Hammer,
  FileText,
  CreditCard,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function Sidebar() {
  const { pathname } = useLocation();

  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: <Hammer className="h-5 w-5" />,
      label: "All Tools",
      to: "/tools",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Documents",
      to: "/documents",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Wallet",
      to: "/wallet",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      to: "/settings",
    },
  ];

  return (
    <aside
      className={cn(
        "w-64 bg-white/5 border-r border-white/10 h-full lg:flex hidden flex-col px-4 py-10 z-[999]"
      )}
    >
      {/* Header */}
      <div className="flex pl-6">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 mt-[40px]">
        {navigationItems.map((item) => {
          const isActive = pathname.includes(item.to);

          return (
            <div className="">
              <Link to={item.to} key={item.to}>
                <button
                  className={cn(
                    "w-full justify-start transition-colors py-3 rounded-2xl px-6 flex items-center",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/10"
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
