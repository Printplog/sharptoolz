import {
  ChevronDown,
  ExternalLink,
  Globe,
  KeyRound,
  Link2,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FernwayLaunchMenuProps {
  homeUrl: string;
  loginUrl: string;
  loggedInUrl?: string | null;
  size?: "default" | "sm";
  className?: string;
}

/**
 * Desktop: Option B split button — click "Open Fernway" to open the main website immediately,
 * or click the chevron for Open Logged In, Open Login Page, and Copy Website Link.
 * Mobile: Single "Open Fernway" menu button showing all 4 actions cleanly in one menu.
 */
export function FernwayLaunchMenu({
  homeUrl,
  loginUrl,
  loggedInUrl,
  size = "default",
  className,
}: FernwayLaunchMenuProps) {
  const isSmall = size === "sm";

  const handleCopyWebsiteLink = () => {
    navigator.clipboard.writeText(homeUrl);
    toast.success("Fernway website link copied!");
  };

  const menuItems = (includeMainSite: boolean) => (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-56 rounded-2xl border border-white/15 bg-[#121a26] p-1.5 text-white shadow-2xl z-[200]"
    >
      {includeMainSite && (
        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:bg-white/10 focus:text-white"
        >
          <a href={homeUrl} target="_blank" rel="noopener noreferrer">
            <Globe className="size-4 text-emerald-400" />
            <span>Open Main Website</span>
            <ExternalLink className="ml-auto size-3.5 text-white/40" />
          </a>
        </DropdownMenuItem>
      )}

      {loggedInUrl && (
        <DropdownMenuItem
          asChild
          className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:bg-white/10 focus:text-white"
        >
          <a href={loggedInUrl} target="_blank" rel="noopener noreferrer">
            <KeyRound className="size-4 text-primary" />
            <span>Open Logged In</span>
            <ExternalLink className="ml-auto size-3.5 text-white/40" />
          </a>
        </DropdownMenuItem>
      )}

      <DropdownMenuItem
        asChild
        className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:bg-white/10 focus:text-white"
      >
        <a href={loginUrl} target="_blank" rel="noopener noreferrer">
          <LogIn className="size-4 text-white/75" />
          <span>Open Login Page</span>
          <ExternalLink className="ml-auto size-3.5 text-white/40" />
        </a>
      </DropdownMenuItem>

      <DropdownMenuSeparator className="my-1 bg-white/10" />

      <DropdownMenuItem
        onSelect={handleCopyWebsiteLink}
        className="cursor-pointer rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:bg-white/10 focus:text-white"
      >
        <Link2 className="size-4 text-white/75" />
        <span>Copy Website Link</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className={cn("inline-flex", !isSmall && "w-full sm:w-auto", className)}>
      {/* Mobile: Single menu button showing all actions */}
      <div className={cn("sm:hidden", !isSmall && "w-full")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-between gap-3 rounded-full bg-[#cee88c] font-bold text-black border border-white/20 transition-colors hover:bg-[#d8ef9f] cursor-pointer",
                isSmall
                  ? "h-8 px-3 text-xs"
                  : "w-full pl-6 pr-2 py-1.5 text-sm md:text-base",
              )}
            >
              <span className="whitespace-nowrap">Open Fernway</span>
              {isSmall ? (
                <ChevronDown className="size-3.5 shrink-0" />
              ) : (
                <span className="flex items-center justify-center w-8 h-8 rounded-full border border-black/40 shrink-0">
                  <ChevronDown className="size-4" />
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          {menuItems(true)}
        </DropdownMenu>
      </div>

      {/* Desktop: Split button (Open Fernway main site | chevron menu) */}
      <div
        className={cn(
          "hidden sm:inline-flex items-stretch rounded-full bg-[#cee88c] text-black font-bold border border-white/20 overflow-hidden",
          isSmall ? "h-8 text-xs" : "text-sm md:text-base",
        )}
      >
        <a
          href={homeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-2.5 transition-colors hover:bg-white/25 whitespace-nowrap",
            isSmall ? "pl-3 pr-2.5" : "pl-6 pr-4 py-2.5",
          )}
        >
          <span>Open Fernway</span>
          <ExternalLink className={isSmall ? "size-3.5" : "size-4"} />
        </a>

        <span className="w-px self-stretch bg-black/20" aria-hidden="true" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More Fernway options"
              title="Open Logged In, Login Page, or Copy Website Link"
              className={cn(
                "inline-flex items-center justify-center transition-colors hover:bg-white/25 cursor-pointer",
                isSmall ? "px-2" : "px-3.5",
              )}
            >
              <ChevronDown className={isSmall ? "size-3.5" : "size-4"} />
            </button>
          </DropdownMenuTrigger>
          {menuItems(false)}
        </DropdownMenu>
      </div>
    </div>
  );
}
