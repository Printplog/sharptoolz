import {
  LogOut,
  Mail,
  KeyRound,
  LifeBuoy,
  Code2,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import UserInfoCard from "@/components/Dashboard/Settings/UserInfoCard";
import ChangePassword from "@/components/Dashboard/Settings/ChangePassword";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  const settingsLinks = [
    {
      label: "Change Password",
      to: "?dialog=change-password",
      icon: KeyRound,
    },
    {
      label: "API",
      to: "/settings/api",
      icon: Code2,
    },
    {
      label: "Customer Service",
      to: settings?.whatsapp_number
        ? `https://wa.me/${settings.whatsapp_number}`
        : "https://wa.me/2348147929994",
      icon: LifeBuoy,
    },
    {
      label: "Help",
      to: settings?.support_email
        ? `mailto:${settings.support_email}`
        : "/help",
      icon: Mail,
    },
    {
      label: "Join Community",
      to: settings?.whatsapp_community_link || settings?.telegram_link || "https://chat.whatsapp.com/HMkF0uqv3ksC0QvNbr8Mqu",
      icon: MessageCircle,
    },
  ];

  const handleLogout = () => {
    // perform logout logic here (clear tokens, call API, etc.)
    logout();
    navigate("/auth/login");
  };

  return (
    <div className="space-y-6 text-white">
      {/* User Info Card */}
      <UserInfoCard />
      {/* Settings Links */}
      <div className="divide-y divide-white/10 overflow-hidden">
        {settingsLinks.map(({ label, to, icon: Icon }) => (
          <Link
            key={label}
            to={to}
            target={to.startsWith("http") ? "_blank" : "_self"}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition"
          >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm">{label}</span>
          </Link>
        ))}
        <div className="">
          <button
            className="text-red-500 border-white/10 w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Logout Button */}

      <ChangePassword />
    </div>
  );
}
