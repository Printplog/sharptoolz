import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { ROLES, type RoleCode } from "@/lib/constants/roles";

const ROLE_MAP: Record<string, string> = {
  [ROLES.ADMIN]: "admin",
  [ROLES.STANDARD]: "user",
  [ROLES.STAFF]: "staff",
};

interface ProtectedLayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export default function ProtectedLayout({ children, isAdmin }: ProtectedLayoutProps) {
  const navigate = useNavigate();
  const { setUser, isAuthenticated, logout } = useAuthStore();

  const { data, isError, isLoading } = useQuery<User, Error>({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 2,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if ((!isLoading && isError) || !isAuthenticated) {
      // Ensure state reflects unauthenticated immediately
      if (isError) logout();
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
      if (isAdmin && role !== "admin" && role !== "staff") {
        toast.error("You are not authorized to access this page");
        navigate("/dashboard"); // or navigate("/") or show 403 page
        return;
      }
    }
  }, [data, setUser, isError, isAdmin, navigate, isAuthenticated, isLoading, logout]);

  if (isLoading) {
    return (
      <PageLoader />
    );
  }

  return <>{children}</>;
}
