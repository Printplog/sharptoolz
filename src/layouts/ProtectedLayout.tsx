import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";

// Obfuscated role code mapping
const ROLE_MAP = {
  "ZK7T-93XY": "admin",
  "LQ5D-21VM": "user",
} as const;

type RoleCode = keyof typeof ROLE_MAP;

interface ProtectedLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function ProtectedLayout({ children, isAdmin }: ProtectedLayoutProps) {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 2,
  });

  useEffect(() => {
    if (isError) {
      toast.error("Session expired, login to continue");
      navigate("/auth/login");
      return;
    }

    if (data) {
      setUser(data);
      console.log(data)
      const roleCode = data.role as RoleCode;
      const role = ROLE_MAP[roleCode];

      if (!role) {
        toast.error("Unauthorized role code");
        navigate("/auth/login");
        return;
      }

      // 🚫 Restrict user from admin route if needed
      if (isAdmin && role !== "admin") {
        toast.error("You are not authorized to access this page");
        navigate("/dashboard"); // or navigate("/") or show 403 page
        return;
      }
    }
  }, [data, setUser, isError, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 items-center justify-center h-screen">
        <Logo />
        <LoaderIcon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
