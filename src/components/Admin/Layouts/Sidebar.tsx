import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    label: "Dashboard",
    to: "/admin/dashboard"
  },
  {
    icon: <Hammer className="h-5 w-5" />,
    label: "Tools",
    to: "/admin/tools"
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 bg-white/5 h-full flex-col px-4 py-10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
          <ClipboardList />
        </div>
        <span className="font-bold text-xl text-foreground">DocsMaker</span>
      </div>

      <nav className="flex-1 space-y-2 mt-[40px]">
        {navigationItems.map((item) => (
          <NavItem
            key={item.to}
            icon={item.icon}
            label={item.label}
            to={item.to}
          />
        ))}
      </nav>
    </aside>
  );
}

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  to: string;
};

function NavItem({ icon, label, to }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start transition-colors py-6 rounded-xl",
        isActive 
          ? "bg-primary text-primary-foreground hover:bg-primary/90" 
          : "text-foreground hover:text-primary hover:bg-primary/10"
      )}
    >
      <Link to={to}>
        {icon}
        <span className="ml-2">{label}</span>
      </Link>
    </Button>
  );
}