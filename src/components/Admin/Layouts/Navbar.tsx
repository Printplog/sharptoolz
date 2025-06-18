import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const user = {
    name: "John Doe",
    email: "john@example.com",
    avatar: "", // Optional avatar URL
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between py-5">
      {/* Left Side - Title */}
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-4">
        {/* Dropdown Menu for User Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="bg-primary text-lg font-semibold text-background size-[40px] flex justify-center items-center rounded-full">
                <h2 className="">{initials}</h2>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>View Main Site</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
