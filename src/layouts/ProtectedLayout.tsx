import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "@/api/apiEndpoints";
import { useAuthStore } from "@/store/authStore";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (isError) {
      toast.error("Session expired, login to continue");
      navigate("/auth/login");
    }
  }, [data, setUser, navigate, isError]);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       toast.error("Please login to continue");
//       navigate("/auth/login");
//     }
//   }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 items-center justify-center h-screen">
        <img src="/logo.png" alt="Logo" className="h-20" />
        <LoaderIcon className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="">
      {children}
    </div>
  );
}
