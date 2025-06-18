import { LayoutDashboard, Wallet, Settings, Hammer } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    icon: LayoutDashboard,
    label: "Home",
    to: "/dashboard",
  },
  {
    icon: Hammer,
    label: "Tools",
    to: "/tools",
  },
  {
    icon: Wallet,
    label: "Wallet",
    to: "/wallet",
  },
  {
    icon: Settings,
    label: "Settings",
    to: "/settings",
  },
];

export default function BottomBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 z-50 w-full bg-background border-t border-white/10 flex justify-around items-center py-4 lg:hidden">
      {navigationItems.map((item) => {
        const isActive = pathname === item.to;
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center text-xs text-muted-foreground hover:text-primary transition-all",
              isActive && "text-primary"
            )}
          >
            <Icon className="w-5 h-5 mb-[2px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
