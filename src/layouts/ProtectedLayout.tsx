import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";
import { AnimatePresence } from "framer-motion";
import { ROLES, type RoleCode } from "@/lib/constants/roles";
import { SESSION_EXPIRED_TOAST_ID } from "@/lib/authSession";
import axios from "axios";

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
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if ((!isLoading && isError && !data) || !isAuthenticated) {
      // Ensure state reflects unauthenticated immediately
      if (isError) logout();
      toast.error("Session expired, login to continue", {
        id: SESSION_EXPIRED_TOAST_ID,
      });
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
      <AnimatePresence>
        <PageLoader />
      </AnimatePresence>
    );
  }

  return <>{children}</>;
}
