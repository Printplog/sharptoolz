import {
  LogOut,
  Mail,
  KeyRound,
  LifeBuoy,
  Code2,
  MessageCircle,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import UserInfoCard from "@/components/Dashboard/Settings/UserInfoCard"
import ChangePassword from "@/components/Dashboard/Settings/ChangePassword"
import { useAuthStore } from "@/store/authStore"
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
    to:  "https://wa.me/2348147929994",
    icon: LifeBuoy,
  },
  {
    label: "Help",
    to: "/help",
    icon: Mail,
  },
  {
    label: "Join WhatsApp Community",
    to: "https://chat.whatsapp.com/HMkF0uqv3ksC0QvNbr8Mqu", // Replace with real invite link
    icon: MessageCircle,
  },
]

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
 

  const handleLogout = () => {
    // perform logout logic here (clear tokens, call API, etc.)
    logout()
    navigate("/auth/login")
  }

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
      </div>

      {/* Logout Button */}
      <div className="">
        <button
          className="text-red-500 border-y border-white/10 flex w-full items-center gap-2 flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
      <ChangePassword />
    </div>
  )
}
