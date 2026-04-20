import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useLogout";

import Logo from "@/components/Logo";

export default function Navbar() {
  const { user } = useAuthStore();
  const { logout, isPending } = useLogout();


  return (
    <header className="flex items-center justify-between py-3 md:py-4 border-b border-white/5 bg-white/[0.02] px-4 md:px-5 sticky top-0 backdrop-blur-2xl z-[9]">
      {/* Left Side - Logo (mobile) / Greeting (desktop) */}
      <div className="flex items-center gap-5">
        <div className="md:hidden">
          <Logo size={28} showText={false} />
        </div>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold text-white tracking-tight italic uppercase italic-primary">
            Hey <span className="text-primary">{user?.username || "Value Visitor"}</span> 👋
          </h2>
        </div>
      </div>
      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        {/* Dropdown Menu for User Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <div className="bg-primary text-lg font-semibold text-background size-[40px] flex justify-center items-center rounded-full">
                <h2 className="">{user?.username[0].toUpperCase()}</h2>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-white/20 text-white">
            <DropdownMenuItem asChild  className="cursor-pointer focus:bg-white/10 focus:text-white/80">
              <Link to="/" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                <span>View Main Site</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()} className="cursor-pointer focus:bg-white/10 focus:text-white/80" disabled={isPending}>
              <LogOut className="mr-2 h-4 w-4 text-primary" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
