import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import PageLoader from "@/components/PageLoader";

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
  const { setUser, isAuthenticated, logout } = useAuthStore();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: 2,
    refetchOnWindowFocus: true,
    onError: () => {
      // Immediately mark as unauthenticated on failed auth check
      logout();
    },
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
      if (isAdmin && role !== "admin") {
        toast.error("You are not authorized to access this page");
        navigate("/dashboard"); // or navigate("/") or show 403 page
        return;
      }
    }
  }, [data, setUser, isError, isAdmin, navigate, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <PageLoader />
    );
  }

  return <>{children}</>;
}
