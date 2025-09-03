import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Hammer,
  Users,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

export default function Sidebar() {
  const { pathname } = useLocation();

  const navigationItems = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      to: "/admin/dashboard",
    },
    {
      icon: <FolderOpen className="h-5 w-5" />,
      label: "Tools",
      to: "/admin/tools",
    },
    {
      icon: <Hammer className="h-5 w-5" />,
      label: "Templates",
      to: "/admin/templates",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      to: "/admin/users",
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
        {navigationItems.map((item) => {
          const isActive = pathname.includes(item.to);

          return (
            <div key={item.to}>
              <Link to={item.to}>
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