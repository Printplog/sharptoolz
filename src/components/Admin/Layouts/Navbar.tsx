import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { LogOut, LayoutDashboard, ChevronDown, AlignLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useLogout";
import { useSidebarStore } from "@/store/sidebarStore";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const { user } = useAuthStore()
  const { logout, isPending } = useLogout();
  const { toggle } = useSidebarStore();


  return (
    <header className="flex items-center justify-between py-5 border-b border-white/10 bg-white/5 px-5 sticky top-0 backdrop-blur-2xl z-[9]">
      {/* Left Side - Title & Mobile Menu Toggle */}
      <div className="flex items-center gap-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="lg:hidden h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <AlignLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold lg:block hidden">Hey {user?.username?.toUpperCase()} 👋</h2>
        <h2 className="text-sm font-semibold lg:hidden block">Hey {user?.username?.split(' ')[0].toUpperCase()} 👋</h2>
      </div>
      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">

        {/* Dropdown Menu for User Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <div className="flex items-center gap-2 group">
              <div className="bg-primary text-lg font-semibold text-background size-[40px] flex justify-center items-center rounded-full group-hover:scale-105 transition-transform">
                <h2 className="">{user?.username[0].toUpperCase()}</h2>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50 group-hover:text-white transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-white/20 text-white">
            <DropdownMenuItem asChild className="cursor-pointer focus:bg-white/10 focus:text-white/80">
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
